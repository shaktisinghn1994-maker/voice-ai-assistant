import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';
import { audit, completeReset } from '../../_lib/store';

// Public but hardened: 6-digit code, single-use, 15-min expiry, strict rate limit.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(`${clientKey(request)}:reset-complete`, 10)) {
    return json({ error: 'Too many attempts. Wait a minute.' }, 429);
  }
  if (!env.DB) return json({ error: 'Reset codes need the database binding.' }, 503);
  const { outletId, code, newPin } = await readJson(request);
  if (typeof outletId !== 'string' || typeof code !== 'string' || typeof newPin !== 'string') {
    return json({ error: 'Outlet, reset code and a new PIN of 4+ characters are required.' }, 400);
  }
  const ok = await completeReset(env.DB, outletId, code, newPin);
  if (!ok) return json({ error: 'Invalid or expired code. Generate a fresh one.' }, 401);
  await audit(env.DB, outletId, outletId, 'staff.reset_completed', '');
  return json({ ok: true });
}
