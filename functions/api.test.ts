import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { onRequestPost as create } from './api/orders/create';
import { onRequestPost as verify } from './api/orders/verify-payment';
import { onRequestPost as incoming } from './api/whatsapp/incoming';
import { onRequestPost as send } from './api/whatsapp/send';
import { onRequestPost as staffLogin } from './api/staff/login';
import { onRequestPost as staffVerify } from './api/staff/verify';
import { onRequestPost as customerLookup } from './api/customer/lookup';
import { onRequestGet as ordersLive } from './api/orders/live';
import { onRequestGet as outletStatusGet, onRequestPost as outletStatusPost } from './api/outlet/status';
import { hmacHex } from './_lib/api';

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

  it('POST /api/staff/login verifies PINs without ever shipping them', async () => {
    const env = {
      STAFF_PINS_JSON: JSON.stringify({ 'zd-main': { cafeName: 'ZERO DEGREE CAFE', pin: 's3cret' } }),
      STAFF_TOKEN_SECRET: 'test-secret',
    };
    const ok = await staffLogin({
      request: post('/api/staff/login', { outletId: 'zd-main', pin: 's3cret' }),
      env,
    });
    expect(ok.status).toBe(200);
    const { token } = await ok.json();
    const check = await staffVerify({ request: post('/api/staff/verify', { token }), env });
    expect((await check.json()).valid).toBe(true);

    const bad = await staffLogin({ request: post('/api/staff/login', { outletId: 'zd-main', pin: 'no' }), env });
    expect(bad.status).toBe(401);

    const unconfigured = await staffLogin({ request: post('/api/staff/login', { outletId: 'zd-main', pin: 's3cret' }), env: {} });
    expect(unconfigured.status).toBe(503);
  });

  it('POST /api/customer/lookup returns saved profiles, misses cleanly', async () => {
    const db = {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => ({
          first: async () => {
            if (String(sql).includes('FROM customers WHERE phone')) {
              return args[0] === '9820471829'
                ? { collegeId: 'MUJ1', name: 'Aarav', phone: '9820471829', block: 'B2', room: '214', payMode: 'upi' }
                : null;
            }
            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => ({}),
        }),
      }),
    };
    const hit = await customerLookup({
      request: post('/api/customer/lookup', { phone: '+91 98204 71829' }),
      env: { DB: db } as never,
    });
    expect(hit.status).toBe(200);
    expect(await hit.json()).toMatchObject({ found: true, name: 'Aarav', block: 'B2' });

    const miss = await customerLookup({
      request: post('/api/customer/lookup', { phone: '6000000001' }),
      env: { DB: db } as never,
    });
    expect(await miss.json()).toEqual({ found: false });

    const noDb = await customerLookup({ request: post('/api/customer/lookup', { phone: '9820471829' }), env: {} });
    expect(await noDb.json()).toEqual({ found: false });
  });

  it('shares one live feed and one OPEN/CLOSED flag per outlet', async () => {
    const secret = 'feed-secret';
    const sign = async (outletId: string) => {
      const exp = Date.now() + 3600_000;
      return `${outletId}.${exp}.${await hmacHex(secret, `${outletId}.${exp}`)}`;
    };
    const authed = async (path: string) =>
      new Request(`http://test${path}`, { headers: { Authorization: `Bearer ${await sign('zd-main')}` } });
    const authedPost = async (path: string, body: unknown) =>
      new Request(`http://test${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await sign('zd-main')}` },
        body: JSON.stringify(body),
      });
    const db = {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => ({
          first: async () => {
            void args;
            if (String(sql).startsWith('SELECT is_open')) return null;
            return null;
          },
          all: async () => ({
            results: String(sql).includes('FROM orders')
              ? [{ order_id: 'RC-9', outlet_id: 'zd-main', customer_id: '', customer_name: 'Aarav', phone: '9820471829', block: 'B1', room: '', items_json: '[]', grand_total: 120, pay_mode: 'COD', pay_status: 'unpaid', status: 'pending_staff_accept', note: '', created_at: 1 }]
              : [],
          }),
          run: async () => ({}),
        }),
      }),
    };
    const env = { STAFF_TOKEN_SECRET: secret, DB: db } as never;

    const anon = await ordersLive({ request: new Request('http://test/api/orders/live'), env: {} as never });
    expect(anon.status).toBe(401);

    const feed = await ordersLive({ request: await authed('/api/orders/live'), env });
    const feedBody = await feed.json();
    expect(feed.status).toBe(200);
    expect(feedBody.orders.map((o: { orderId: string }) => o.orderId)).toEqual(['RC-9']);

    const closed = await outletStatusPost({ request: await authedPost('/api/outlet/status', { isOpen: false }), env });
    expect((await closed.json()).isOpen).toBe(false);

    const status = await outletStatusGet({ request: await authed('/api/outlet/status?outletId=zd-main'), env });
    expect(status.status).toBe(200);
  });
});
