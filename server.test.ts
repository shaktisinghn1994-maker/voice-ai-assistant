import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './server';

const baseOrder = {
  outletId: 'zd-main',
  customerPhone: '+91 98204 71829',
  customerName: 'Aarav',
  blockNumber: 'B1',
  roomNo: '214',
  items: [{ item_id: 'cc1', quantity: 1 }],
  grandTotal: 100,
};

describe('API - orders + whatsapp + zip removal', () => {
  it('POST /api/orders/create accepts collegeId and echoes it', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/orders/create')
      .send({ ...baseOrder, collegeId: 'MUJ2024001234' });
    expect(res.status).toBe(200);
    expect(res.body.collegeId).toBe('MUJ2024001234');
    expect(res.body.orderId).toMatch(/^RC-/);
  });

  it('POST /api/orders/create rejects without Name + Block', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/orders/create')
      .send({ ...baseOrder, customerName: '', blockNumber: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Name \+ Block/);
  });

  it('POST /api/staff/login accepts the outlet PIN and returns a token', async () => {
    const app = createApp();
    const res = await request(app).post('/api/staff/login').send({ outletId: 'zd-main', pin: 'zero-g1-2026' });
    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^zd-main\.\d+\.[0-9a-f]+$/);
    const check = await request(app).post('/api/staff/verify').send({ token: res.body.token });
    expect(check.body).toEqual({ valid: true, outletId: 'zd-main' });
  });

  it('POST /api/staff/login rejects wrong PINs without leaking which part failed differently', async () => {
    const app = createApp();
    const res = await request(app).post('/api/staff/login').send({ outletId: 'zd-main', pin: 'nope' });
    expect(res.status).toBe(401);
    const forged = await request(app).post('/api/staff/verify').send({ token: 'zd-main.9999999999999.deadbeef' });
    expect(forged.status).toBe(401);
  });

  it('POST /api/orders/create rejects an empty items list', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/orders/create')
      .send({ ...baseOrder, items: [] });
    expect(res.status).toBe(400);
  });

  it('POST /api/orders/create rejects malformed item quantities', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/orders/create')
      .send({ ...baseOrder, items: [{ item_id: 'cc1', quantity: 0 }] });
    expect(res.status).toBe(400);
  });

  it('POST /api/whatsapp/send caps at 2 messages per order', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ to: '+91 1', orderId: 'RC-1', messages: ['a', 'b', 'c', 'd', 'e'] });
    expect(res.status).toBe(200);
    expect(res.body.sentCount).toBe(2);
    expect(res.body.capped).toBe(true);
  });

  it('voice AI stays disabled (410)', async () => {
    const app = createApp();
    const res = await request(app).post('/api/voice-agent/turn').send({});
    expect(res.status).toBe(410);
  });

  it('download zip endpoint is removed (404)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/download-source-zip');
    expect(res.status).toBe(404);
  });

  it('rate-limits abusive bursts on /api (429)', async () => {
    const app = createApp();
    let lastStatus = 200;
    for (let i = 0; i < 150; i++) {
      const res = await request(app).post('/api/whatsapp/send').send({ to: 't', orderId: 'RC-1', messages: [] });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});
