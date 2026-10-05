// Petpooja push: real save_order call when credentials are configured,
// deterministic mock otherwise. Shared by the Express server (dev) and the
// Cloudflare Functions/Worker (production) so both behave identically.

export interface PetpoojaEnv {
  PETPOOJA_APP_KEY?: string;
  PETPOOJA_APP_SECRET?: string;
  PETPOOJA_SAVE_ORDER_URL?: string;
}

export interface PetpoojaResult {
  mock: boolean;
  petpooja_order_id: string;
  kot_number: string;
}

export async function pushToPetpooja(payload: unknown, env: PetpoojaEnv): Promise<PetpoojaResult> {
  const { PETPOOJA_APP_KEY, PETPOOJA_APP_SECRET, PETPOOJA_SAVE_ORDER_URL } = env;
  if (!PETPOOJA_APP_KEY || !PETPOOJA_SAVE_ORDER_URL) {
    const randomNum = Math.floor(8100 + Math.random() * 1800);
    return {
      mock: true,
      petpooja_order_id: `PP-ORD-${randomNum}`,
      kot_number: `KOT #PP-${randomNum}`,
    };
  }
  const res = await fetch(PETPOOJA_SAVE_ORDER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: PETPOOJA_APP_KEY,
      app_secret: PETPOOJA_APP_SECRET ?? '',
      payload,
    }),
  });
  if (!res.ok) throw new Error(`Petpooja push failed: HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = data[k];
      if (typeof v === 'string' && v) return v;
    }
    return undefined;
  };
  return {
    mock: false,
    petpooja_order_id: pick('petpooja_order_id', 'order_id', 'orderId') ?? 'PP-ORD-?',
    kot_number: pick('kot_number', 'kotNumber', 'kot') ?? 'KOT-?',
  };
}
