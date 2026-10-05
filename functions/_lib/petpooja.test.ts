import { describe, expect, it, vi, afterEach } from 'vitest';
import { pushToPetpooja } from './petpooja';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pushToPetpooja', () => {
  it('returns a deterministic-shaped mock without credentials', async () => {
    const res = await pushToPetpooja({ orderId: 'RC-1' }, {});
    expect(res.mock).toBe(true);
    expect(res.petpooja_order_id).toMatch(/^PP-ORD-/);
    expect(res.kot_number).toMatch(/^KOT #PP-/);
  });

  it('calls the real endpoint when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ kot_number: 'KOT-42', petpooja_order_id: 'PP-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await pushToPetpooja(
      { orderId: 'RC-1' },
      { PETPOOJA_APP_KEY: 'k', PETPOOJA_SAVE_ORDER_URL: 'https://pos.example/save' },
    );
    expect(res.mock).toBe(false);
    expect(res.kot_number).toBe('KOT-42');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws on HTTP failure so callers can retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(
      pushToPetpooja({ orderId: 'RC-1' }, { PETPOOJA_APP_KEY: 'k', PETPOOJA_SAVE_ORDER_URL: 'https://x' }),
    ).rejects.toThrow(/HTTP 500/);
  });
});
