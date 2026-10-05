import {
  PagesContext,
  clientKey,
  hmacHex,
  json,
  rateLimited,
  readJson,
  verifyToken,
} from '../../_lib/api';
import { audit, verifyStaffDb } from '../../_lib/store';

const LOGIN_RATE_MAX = 10;
const SESSION_MS = 12 * 60 * 60 * 1000;

interface EnvPins {
  [outletId: string]: { cafeName: string; pin: string };
}

function readEnvPins(env: PagesContext['env']): EnvPins {
  try {
    const raw = env.STAFF_PINS_JSON;
    if (raw) return JSON.parse(raw) as EnvPins;
  } catch {
    // malformed env - closed in production
  }
  return {};
}

async function signToken(secret: string, outletId: string, expiresAt: number): Promise<string> {
  const body = `${outletId}.${expiresAt}`;
  return `${body}.${await hmacHex(secret, body)}`;
}

async function checkEnvPin(env: PagesContext['env'], outletId: unknown, pin: unknown): Promise<string | null> {
  const pins = readEnvPins(env);
  const entry = typeof outletId === 'string' ? pins[outletId] : undefined;
  if (!entry || typeof pin !== 'string' || pin.trim() !== entry.pin) return null;
  return entry.cafeName;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  if (rateLimited(`${clientKey(request)}:login`, LOGIN_RATE_MAX)) {
    return json({ error: 'Too many login attempts. Wait a minute and try again.' }, 429);
  }
  const secret = env.STAFF_TOKEN_SECRET;
  if (!secret) return json({ error: 'Staff login is not configured on this server.' }, 503);
  const { outletId, pin } = await readJson(request);
  if (typeof outletId !== 'string' || typeof pin !== 'string') {
    return json({ error: 'Wrong PIN for this outlet. Ask the owner for the current staff PIN and try again.' }, 401);
  }

  // D1 staff table first (hashed PINs, lockout); env PINs as dev fallback.
  let cafeName: string | null = null;
  if (env.DB) {
    try {
      const checked = await verifyStaffDb(env.DB, outletId, pin);
      if (checked.locked) return json({ error: 'Too many wrong attempts. Locked for 15 minutes.' }, 429);
      if (checked.ok) {
        cafeName = checked.cafeName ?? null;
        await audit(env.DB, outletId, outletId, 'staff.login', 'D1');
      }
    } catch {
      // storage hiccup - fall through to env fallback below
    }
  }
  cafeName ??= await checkEnvPin(env, outletId, pin);
  if (!cafeName) {
    return json({ error: 'Wrong PIN for this outlet. Ask the owner for the current staff PIN and try again.' }, 401);
  }
  const expiresAt = Date.now() + SESSION_MS;
  return json({ token: await signToken(secret, outletId, expiresAt), cafeName, expiresAt });
}

export { verifyToken };
