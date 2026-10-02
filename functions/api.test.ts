import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { onRequestPost as create } from './api/orders/create';
import { onRequestPost as verify } from './api/orders/verify-payment';
import { onRequestPost as incoming } from './api/whatsapp/incoming';
import { onRequestPost as send } from './api/whatsapp/send';

function post(path: string, body: unknown): Request {
  return new Request(`http://test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const baseOrder = {
  outletId: 'zd-main',
  customerPhone: '+91 98204 71829',
  customerName: 'Aarav',
  blockNumber: 'B1',
  items: [{ item_id: 'cc1', quantity: 1 }],
  grandTotal: 100,
};

describe('Pages Functions API (Cloudflare production)', () => {
  it('POST /api/orders/create accepts a valid order', async () => {
    const res = await create({ request: post('/api/orders/create', { ...baseOrder, collegeId: 'MUJ1' }), env: {} });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orderId).toMatch(/^RC-/);
    expect(data.collegeId).toBe('MUJ1');
  });

  it('POST /api/orders/create rejects missing Name + Block', async () => {
    const res = await create({ request: post('/api/orders/create', { ...baseOrder, customerName: '' }), env: {} });
    expect(res.status).toBe(400);
  });

  it('POST /api/orders/verify-payment stub-verifies in pilot mode', async () => {
    const res = await verify({ request: post('/api/orders/verify-payment', { orderId: 'RC-1', razorpayPaymentId: 'pay_x' }), env: {} });
    expect(res.status).toBe(200);
    expect((await res.json()).verified).toBe(true);
  });

  it('POST /api/orders/verify-payment checks HMAC when secret is set', async () => {
    const secret = 'test_secret';
    const sig = createHmac('sha256', secret).update('RC-1|pay_x').digest('hex');
    const ok = await verify({ request: post('/api/orders/verify-payment', { orderId: 'RC-1', razorpayPaymentId: 'pay_x', razorpaySignature: sig }), env: { RAZORPAY_KEY_SECRET: secret } });
    expect(ok.status).toBe(200);
    const bad = await verify({ request: post('/api/orders/verify-payment', { orderId: 'RC-1', razorpayPaymentId: 'pay_x', razorpaySignature: 'deadbeef' }), env: { RAZORPAY_KEY_SECRET: secret } });
    expect(bad.status).toBe(400);
  });

  it('POST /api/whatsapp/incoming answers hi with the menu step', async () => {
    const res = await incoming({ request: post('/api/whatsapp/incoming', { text: 'hi' }), env: {} });
    expect((await res.json()).step).toBe('menu');
  });

  it('POST /api/whatsapp/send caps at 2 messages', async () => {
    const res = await send({ request: post('/api/whatsapp/send', { to: 't', orderId: 'RC-1', messages: ['a', 'b', 'c'] }), env: {} });
    const data = await res.json();
    expect(data.sentCount).toBe(2);
    expect(data.capped).toBe(true);
  });
});
