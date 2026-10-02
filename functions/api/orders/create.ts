import { CreateOrderSchema, PagesContext, clientKey, json, rateLimited, readJson } from '../../_lib/api';

export async function onRequestPost({ request }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const parsed = CreateOrderSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Invalid order payload.' }, 400);
  }
  const { customerPhone, collegeId, grandTotal } = parsed.data;
  const phone = String(customerPhone).replace(/\s+/g, '');
  // Demo directory: numbers ending with 829 / 090 are treated as repeat_verified.
  const isRepeatDemo = /829$|090$|1102$|4211$/.test(phone);
  const total = Number(grandTotal) || 0;
  let trustTier = 'new_unknown';
  if (isRepeatDemo) trustTier = 'repeat_verified';
  else if (total <= 300) trustTier = 'low_history';
  const orderId = `RC-${Date.now().toString().slice(-6)}`;
  return json({ orderId, trustTier, status: 'pending_pay', expiresInMin: 10, collegeId: collegeId || undefined });
}
