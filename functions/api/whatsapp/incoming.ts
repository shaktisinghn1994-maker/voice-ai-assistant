import { PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';

export async function onRequestPost({ request }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const { text, name, blockNumber } = await readJson(request);
  const t = String(text || '').trim().toLowerCase();
  const hasName = !!(name && String(name).trim().length >= 2);
  const hasBlock = !!(blockNumber && String(blockNumber).trim());
  const qrLink = 'https://your-domain/qr?outlet=hostel-canteen-1';
  if (['hi', 'hello', 'hey', 'menu', 'order'].includes(t) || !t) {
    return json({
      step: 'menu',
      replyText: `Namaste! Select your order:\n1. Paneer Roll Rs150\n2. Cold Coffee Rs140\n3. Peri-Peri Fries Rs130\n4. Maggi Double Rs165\n\nFast order here: ${qrLink}\n\nThen send Name (type) + Block (A/B/C/D/E/Mess) + note if any.`,
    });
  }
  if (!hasName || !hasBlock) {
    return json({
      step: 'need_identity',
      replyText: `Almost done. Send Name + Block to complete.\nExample: Aarav, Block B 214.\nOr tap here to fill fast: ${qrLink}\nNo KOT until Name + Block filled.`,
    });
  }
  return json({
    step: 'complete',
    replyText: `Thanks ${String(name).trim()}! Block ${String(blockNumber).trim()} noted.\nBill + UPI link next (1 msg). Reply YES to fire KOT. Dispatch update after that (1 msg).`,
  });
}
