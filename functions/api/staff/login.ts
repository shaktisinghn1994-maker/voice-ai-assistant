import { PagesContext, clientKey, hmacHex, json, rateLimited, readJson, safeEqual } from '../../_lib/api';

const LOGIN_RATE_MAX = 10;
const SESSION_MS = 12 * 60 * 60 * 1000;

interface StaffPins {
  [outletId: string]: { cafeName: string; pin: string };
}

function readStaffPins(env: PagesContext['env']): StaffPins {
  try {
    const raw = env.STAFF_PINS_JSON;
    if (raw) return JSON.parse(raw) as StaffPins;
  } catch {
    // malformed env - closed in production
  }
  return {};
}

async function signToken(secret: string, outletId: string, expiresAt: number): Promise<string> {
  const body = `${outletId}.${expiresAt}`;
  return `${body}.${await hmacHex(secret, body)}`;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(`${clientKey(request)}:login`, LOGIN_RATE_MAX)) {
    return json({ error: 'Too many login attempts. Wait a minute and try again.' }, 429);
  }
  const secret = env.STAFF_TOKEN_SECRET;
  if (!secret) return json({ error: 'Staff login is not configured on this server.' }, 503);
  const { outletId, pin } = await readJson(request);
  const pins = readStaffPins(env);
  const entry = typeof outletId === 'string' ? pins[outletId] : undefined;
  if (!entry || typeof pin !== 'string' || pin.trim() !== entry.pin) {
    return json({ error: 'Wrong PIN for this outlet. Ask the owner for the current staff PIN and try again.' }, 401);
  }
  const expiresAt = Date.now() + SESSION_MS;
  return json({ token: await signToken(secret, outletId as string, expiresAt), cafeName: entry.cafeName, expiresAt });
}

export async function verifyToken(
  secret: string | undefined,
  token: unknown,
): Promise<string | null> {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [outletId, expStr, sig] = parts;
  const expiresAt = Number(expStr);
  if (!outletId || !expiresAt || Date.now() > expiresAt) return null;
  const expected = await hmacHex(secret, `${outletId}.${expiresAt}`);
  return safeEqual(expected, sig) ? outletId : null;
}
