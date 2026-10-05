import { PagesContext, clientKey, json, rateLimited, requireStaff } from '../../_lib/api';
import { listLiveOrders } from '../../_lib/store';

// Staff kitchen feed: today's orders for the caller's outlet, newest first.
// Staff screens poll this every few seconds; each phone sees the same queue.
export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (rateLimited(`${clientKey(request)}:feed`, 120)) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  if (!env.DB) return json({ orders: [] });
  const url = new URL(request.url);
  const hours = Math.min(Number(url.searchParams.get('hours') ?? '12') || 12, 72);
  const sinceSec = Math.floor(Date.now() / 1000) - hours * 3600;
  const orders = await listLiveOrders(env.DB, staff.outletId, sinceSec);
  return json({ orders });
}
