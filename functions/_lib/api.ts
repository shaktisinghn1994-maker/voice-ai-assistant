import { z } from 'zod';

// Mirrors server.ts validation. Keep both in sync; server.ts serves local dev,
// these Functions serve Cloudflare Pages production.

export const OrderItemSchema = z
  .object({
    item_id: z.string().min(1),
    quantity: z.number().int().positive(),
  })
  .passthrough();

export const CreateOrderSchema = z.object({
  outletId: z.string().min(1),
  customerPhone: z.string().min(1),
  collegeId: z.string().optional(),
  customerName: z.string().trim().min(1, 'Order incomplete: Name + Block number required.'),
  blockNumber: z.string().trim().min(1, 'Order incomplete: Name + Block number required.'),
  roomNo: z.string().optional().default(''),
  instructions: z.string().optional().default(''),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item.'),
  grandTotal: z.coerce.number().nonnegative().default(0),
});

export interface PagesEnv {
  RAZORPAY_KEY_SECRET?: string;
  PETPOOJA_APP_KEY?: string;
  PETPOOJA_APP_SECRET?: string;
  PETPOOJA_SAVE_ORDER_URL?: string;
  STAFF_PINS_JSON?: string;
  STAFF_TOKEN_SECRET?: string;
}

export interface PagesContext {
  request: Request;
  env: PagesEnv;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // No CSP: the app relies on inline styles; these three are safe everywhere.
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Per-isolate in-memory rate limit (each Pages isolate tracks its own window;
// good enough for pilot abuse protection, not a hard global cap).
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= max) return true;
  times.push(now);
  hits.set(key, times);
  return false;
}

export function clientKey(req: Request): string {
  return req.headers.get('CF-Connecting-IP') ?? 'unknown';
}

export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
