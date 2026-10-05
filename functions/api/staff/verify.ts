import { PagesContext, json, readJson, verifyToken } from '../../_lib/api';

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const { token } = await readJson(request);
  const outletId = await verifyToken(env.STAFF_TOKEN_SECRET, token);
  if (!outletId) return json({ valid: false }, 401);
  return json({ valid: true, outletId });
}
