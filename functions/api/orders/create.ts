import { CreateOrderSchema, PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';
import { saveOrderRecord } from '../../_lib/store';

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const parsed = CreateOrderSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Invalid order payload.' }, 400);
  }
  const { outletId, customerPhone, collegeId, customerName, blockNumber, roomNo, instructions, items, grandTotal } = parsed.data;
  const phone = String(customerPhone).replace(/\s+/g, '');
  // Demo directory: numbers ending with 829 / 090 are treated as repeat_verified.
  const isRepeatDemo = /829$|090$|1102$|4211$/.test(phone);
  const total = Number(grandTotal) || 0;
  let trustTier = 'new_unknown';
  if (isRepeatDemo) trustTier = 'repeat_verified';
  else if (total <= 300) trustTier = 'low_history';
  const orderId = `RC-${Date.now().toString().slice(-6)}`;
  if (env.DB) {
    try {
      await saveOrderRecord(env.DB, {
        orderId,
        outletId,
        customerId: collegeId || undefined,
        customerName: String(customerName),
        phone: phone,
        block: String(blockNumber),
        room: roomNo,
        items: items as unknown[],
        subtotal: Number(grandTotal) || 0,
        tax: 0,
        packaging: 0,
        grandTotal: Number(grandTotal) || 0,
        payMode: 'UPI_PREPAID',
        note: instructions,
      });
    } catch {
      // hot storage is best-effort; the order response must not fail
    }
  }
  return json({ orderId, trustTier, status: 'pending_pay', expiresInMin: 10, collegeId: collegeId || undefined });
}
