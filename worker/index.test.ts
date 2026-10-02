import { describe, expect, it } from 'vitest';
import worker from './index';

const env = {};

function post(path: string, body: unknown): Request {
  return new Request(`http://test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Worker entry (voice-ai-assistant)', () => {
  it('routes POST /api/orders/create with validation', async () => {
    const ok = await worker.fetch(
      post('/api/orders/create', {
        outletId: 'zd-main',
        customerPhone: '+91 1',
        customerName: 'Aarav',
        blockNumber: 'B1',
        items: [{ item_id: 'cc1', quantity: 1 }],
      }),
      env,
    );
    expect(ok.status).toBe(200);

    const bad = await worker.fetch(
      post('/api/orders/create', { outletId: 'x', customerPhone: 'y', customerName: '', blockNumber: '', items: [] }),
      env,
    );
    expect(bad.status).toBe(400);
  });

  it('returns 404 for unknown paths without an ASSETS binding', async () => {
    const res = await worker.fetch(new Request('http://test/nope'), env);
    expect(res.status).toBe(404);
  });

  it('serves static assets through the ASSETS binding', async () => {
    const asAssets = {
      ASSETS: { fetch: async () => new Response('<html></html>', { status: 200 }) },
    };
    const res = await worker.fetch(new Request('http://test/'), asAssets);
    expect(res.status).toBe(200);
  });
});
