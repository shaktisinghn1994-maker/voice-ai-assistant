import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';
import { lookupCustomer, lookupCustomerById } from '../../_lib/store';

// Public lookup: type your mobile number (or College ID) on a new phone and
// your saved Name + Block + Room fill in. Exact match only, minimal fields,
// strict rate limit — no passwords, no OTP cost.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(`${clientKey(request)}:lookup`, 30)) {
    return json({ error: 'Too many lookups. Wait a minute.' }, 429);
  }
  if (!env.DB) return json({ found: false });
  const { phone, collegeId } = await readJson(request);
  const idText = typeof collegeId === 'string' ? collegeId : '';
  const phoneText = typeof phone === 'string' ? phone : '';
  const profile = idText.trim()
    ? await lookupCustomerById(env.DB, idText)
    : await lookupCustomer(env.DB, phoneText);
  if (!profile) return json({ found: false });
  return json({ found: true, ...profile });
}
