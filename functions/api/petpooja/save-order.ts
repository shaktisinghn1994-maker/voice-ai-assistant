import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';
import { pushToPetpooja } from '../../_lib/petpooja';

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const { payload } = await readJson(request);
  try {
    const result = await pushToPetpooja(payload, env);
    return json({
      success: '1',
      message: result.mock
        ? 'Pilot mock: order accepted locally, push to a real POS terminal when credentials are configured.'
        : 'Order successfully pushed to Petpooja POS terminal and KOT printed.',
      petpooja_order_id: result.petpooja_order_id,
      kot_number: result.kot_number,
      timestamp: new Date().toISOString(),
      received_payload_size: JSON.stringify(payload || {}).length,
    });
  } catch {
    return json({ error: 'Petpooja webhook error' }, 500);
  }
}
