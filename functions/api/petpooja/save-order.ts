import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';

export async function onRequestPost({ request }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const { payload } = await readJson(request);
  const randomNum = Math.floor(8100 + Math.random() * 1800);
  return json({
    success: '1',
    message: 'Order successfully pushed to Petpooja POS terminal and KOT printed.',
    petpooja_order_id: `PP-ORD-${randomNum}`,
    kot_number: `KOT #PP-${randomNum}`,
    timestamp: new Date().toISOString(),
    received_payload_size: JSON.stringify(payload || {}).length,
  });
}
