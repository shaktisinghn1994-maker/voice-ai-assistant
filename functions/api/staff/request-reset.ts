import { PagesContext, clientKey, json, rateLimited, requireStaff } from '../../_lib/api';
import { audit, requestResetCode } from '../../_lib/store';

// Logged-in staff generates a one-time reset code and reads it to the
// locked-out colleague in person. No code is ever sent anywhere.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (rateLimited(`${clientKey(request)}:reset`, 10)) {
    return json({ error: 'Too many attempts. Wait a minute.' }, 429);
  }
  if (!env.DB) return json({ error: 'Reset codes need the database binding.' }, 503);
  const code = await requestResetCode(env.DB, staff.outletId);
  if (!code) return json({ error: 'Too many active codes, or no staff account. Use an existing code.' }, 429);
  await audit(env.DB, staff.outletId, staff.outletId, 'staff.reset_requested', '');
  return json({ code, expiresInMin: 15 });
}
