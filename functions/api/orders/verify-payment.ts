import { PagesContext, clientKey, hmacHex, json, rateLimited, readJson, safeEqual } from '../../_lib/api';

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return json({ error: 'Too many requests. Please slow down.' }, 429);
  }
  const { orderId, razorpayPaymentId, razorpaySignature } = await readJson(request);
  if (!orderId) return json({ error: 'Missing orderId' }, 400);
  const secret = env.RAZORPAY_KEY_SECRET;
  if (secret) {
    if (!razorpayPaymentId || !razorpaySignature) {
      return json({ error: 'Missing Razorpay payment id or signature.' }, 400);
    }
    const expected = await hmacHex(secret, `${orderId}|${razorpayPaymentId}`);
    if (!safeEqual(expected, String(razorpaySignature))) {
      return json({ error: 'Invalid payment signature.' }, 400);
    }
    return json({ orderId, verified: true, paymentStatus: 'paid' });
  }
  // No secret: pilot stub (test mode only, never production).
  return json({ orderId, verified: !!razorpayPaymentId, paymentStatus: 'paid' });
}
