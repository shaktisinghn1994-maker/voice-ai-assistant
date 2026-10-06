import { PagesContext, clientKey, json, rateLimited, readJson, requireStaff } from '../../_lib/api';
import { audit } from '../../_lib/store';

const ALLOWED_STATUS = new Set([
  'pending_staff_accept', 'accepted', 'pushed_to_petpooja', 'preparing',
  'dispatched', 'delivered', 'cancelled',
]);
const ALLOWED_PAY = new Set(['unpaid', 'advance_paid', 'paid', 'failed']);

// Staff pushes a status/payment change so every phone (including the
// customer's receipt) reads the same state. Scoped to the caller's outlet.
// KOT numbers stay local-only until the POS schema grows a column for them.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (rateLimited(`${clientKey(request)}:order-update`, 120)) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  if (!env.DB) return json({ error: 'Order updates need the database binding.' }, 503);
  const body = await readJson(request);
  const { orderId, status, paymentStatus } = body;
  if (typeof orderId !== 'string' || !orderId) return json({ error: 'Missing orderId.' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (typeof status === 'string' && ALLOWED_STATUS.has(status)) {
    sets.push('status = ?');
    args.push(status);
  }
  if (typeof paymentStatus === 'string' && ALLOWED_PAY.has(paymentStatus)) {
    sets.push('pay_status = ?');
    args.push(paymentStatus);
  }
  if (sets.length === 0) return json({ error: 'Nothing to update.' }, 400);
  await env.DB.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE order_id = ? AND outlet_id = ?`)
    .bind(...args, orderId, staff.outletId)
    .run();
  await audit(env.DB, staff.outletId, staff.outletId, 'order.update', `${orderId}: ${sets.join(',')}`);
  return json({ ok: true, orderId });
}
