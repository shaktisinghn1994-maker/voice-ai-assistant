import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';

// Public order tracking: anyone holding an order ID sees its kitchen status.
// Returns status + payment state only — no names, phones, or totals.
export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(`${clientKey(request)}:track`, 60)) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  if (!env.DB) return json({ error: 'Order tracking is offline right now.' }, 404);
  const url = new URL(request.url);
  let orderId: unknown = url.searchParams.get('orderId');
  if (!orderId) {
    try {
      orderId = (await readJson(request)).orderId;
    } catch {
      orderId = undefined;
    }
  }
  if (typeof orderId !== 'string' || !orderId) return json({ error: 'Missing orderId.' }, 400);
  const row = await env.DB.prepare(
    'SELECT status, pay_status FROM orders WHERE order_id = ?',
  )
    .bind(orderId)
    .first<{ status: string; pay_status: string }>();
  if (!row) return json({ error: 'Order not found. Check the order ID.' }, 404);
  return json({ orderId, status: row.status, paymentStatus: row.pay_status });
}
