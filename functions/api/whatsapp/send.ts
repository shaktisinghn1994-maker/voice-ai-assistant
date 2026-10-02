import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';

export async function onRequestPost({ request }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const { to, orderId, messages } = await readJson(request);
  const list = Array.isArray(messages) ? messages : [];
  const capped = list.slice(0, 2);
  const estCostInr = Number((capped.length * 0.45).toFixed(2));
  return json({
    to,
    orderId,
    sentCount: capped.length,
    capped: list.length > 2,
    estCostInr,
    note: 'Status checks use free link /o/orderId + missed-call IVR. No tracking spam.',
  });
}
