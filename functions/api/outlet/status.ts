import { PagesContext, json, rateLimited, readJson, requireStaff, clientKey } from '../../_lib/api';
import { audit, getOutletStatus, setOutletStatus } from '../../_lib/store';

// Shared OPEN/CLOSED: every phone reads the same flag.
// GET is public (customers need it); POST needs a staff token.
export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const url = new URL(request.url);
  const outletId = url.searchParams.get('outletId') ?? 'zd-main';
  if (!env.DB) return json({ outletId, isOpen: true, source: 'fallback' });
  return json({ outletId, isOpen: await getOutletStatus(env.DB, outletId), source: 'server' });
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (rateLimited(`${clientKey(request)}:outlet`, 60)) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  if (!env.DB) return json({ error: 'Outlet status needs the database binding.' }, 503);
  const { isOpen } = await readJson(request);
  await setOutletStatus(env.DB, staff.outletId, isOpen !== false);
  await audit(env.DB, staff.outletId, staff.outletId, isOpen !== false ? 'outlet.opened' : 'outlet.closed', '');
  return json({ outletId: staff.outletId, isOpen: isOpen !== false });
}
