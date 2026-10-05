import { safeEqual } from './api';

// D1-backed hot storage. Every function degrades gracefully when no DB
// binding exists (local dev without `wrangler dev --d1`): callers fall back
// to their pilot behavior instead of failing.

export interface D1Stmt {
  bind(...args: unknown[]): { first<T>(): Promise<T | null>; all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
}

export interface D1 {
  prepare(query: string): D1Stmt;
}

const PBKDF2_ITERATIONS = 60000;

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function utf8(text: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new TextEncoder().encode(text));
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function randomHex(nBytes: number): string {
  const buf = new Uint8Array(nBytes);
  crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

export async function hashPassword(pin: string, saltHex: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', utf8(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8(text));
  return bytesToHex(new Uint8Array(digest));
}

interface StaffRow {
  outlet_id: string;
  username: string;
  cafe_name: string;
  pass_salt: string;
  pass_hash: string;
  iterations: number;
  failed_attempts: number;
  locked_until: number;
}

const LOCKOUT_AFTER = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function verifyStaffDb(
  db: D1,
  outletId: string,
  pin: string,
): Promise<{ ok: boolean; username?: string; cafeName?: string; locked?: boolean }> {
  const row = await db
    .prepare('SELECT * FROM staff_users WHERE outlet_id = ? ORDER BY rowid LIMIT 1')
    .bind(outletId)
    .first<StaffRow>();
  if (!row) return { ok: false };
  if (row.locked_until && Date.now() < row.locked_until) return { ok: false, locked: true };
  const hash = await hashPassword(pin.trim(), row.pass_salt, row.iterations || PBKDF2_ITERATIONS);
  if (!safeEqual(hash, row.pass_hash)) {
    const fails = (row.failed_attempts || 0) + 1;
    const lockedUntil = fails >= LOCKOUT_AFTER ? Date.now() + LOCKOUT_MS : 0;
    await db
      .prepare('UPDATE staff_users SET failed_attempts = ?, locked_until = ? WHERE outlet_id = ? AND username = ?')
      .bind(fails, lockedUntil, outletId, row.username)
      .run();
    return { ok: false, locked: lockedUntil > 0 };
  }
  await db
    .prepare('UPDATE staff_users SET failed_attempts = 0, locked_until = 0 WHERE outlet_id = ? AND username = ?')
    .bind(outletId, row.username)
    .run();
  return { ok: true, username: row.username, cafeName: row.cafe_name };
}

export async function setStaffPin(
  db: D1,
  outletId: string,
  username: string,
  cafeName: string,
  pin: string,
): Promise<void> {
  const salt = randomHex(16);
  const hash = await hashPassword(pin.trim(), salt);
  await db
    .prepare(
      `INSERT INTO staff_users (outlet_id, username, cafe_name, pass_salt, pass_hash, iterations, failed_attempts, locked_until)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)
       ON CONFLICT(outlet_id, username) DO UPDATE SET cafe_name = excluded.cafe_name, pass_salt = excluded.pass_salt, pass_hash = excluded.pass_hash, iterations = excluded.iterations, failed_attempts = 0, locked_until = 0`,
    )
    .bind(outletId, username, cafeName, salt, hash, PBKDF2_ITERATIONS)
    .run();
}

// --- Owner-assisted reset: code is shown on the owner's screen, never sent ---

export function makeResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestResetCode(db: D1, outletId: string): Promise<string | null> {
  const user = await db
    .prepare('SELECT username FROM staff_users WHERE outlet_id = ? ORDER BY rowid LIMIT 1')
    .bind(outletId)
    .first<{ username: string }>();
  if (!user) return null;
  const username = user.username;
  const active = await db
    .prepare('SELECT COUNT(*) AS n FROM staff_resets WHERE outlet_id = ? AND username = ? AND used = 0 AND expires_at > ?')
    .bind(outletId, username, Date.now())
    .first<{ n: number }>();
  if ((active?.n ?? 0) >= 3) return null;
  const code = makeResetCode();
  await db
    .prepare('INSERT INTO staff_resets (code_hash, outlet_id, username, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(`${outletId}:${username}:${code}`), outletId, username, Date.now() + 15 * 60 * 1000)
    .run();
  return code;
}

export async function completeReset(
  db: D1,
  outletId: string,
  code: string,
  newPin: string,
): Promise<boolean> {
  if (!newPin || newPin.trim().length < 4) return false;
  const user = await db
    .prepare('SELECT username, cafe_name FROM staff_users WHERE outlet_id = ? ORDER BY rowid LIMIT 1')
    .bind(outletId)
    .first<{ username: string; cafe_name: string }>();
  if (!user) return false;
  const codeHash = await sha256Hex(`${outletId}:${user.username}:${code.trim()}`);
  const row = await db
    .prepare('SELECT code_hash FROM staff_resets WHERE code_hash = ? AND used = 0 AND expires_at > ?')
    .bind(codeHash, Date.now())
    .first<{ code_hash: string }>();
  if (!row) return false;
  await setStaffPin(db, outletId, user.username, user.cafe_name, newPin);
  await db.prepare('UPDATE staff_resets SET used = 1 WHERE code_hash = ?').bind(codeHash).run();
  return true;
}

export async function audit(db: D1, outletId: string, actor: string, action: string, detail = ''): Promise<void> {
  try {
    await db
      .prepare('INSERT INTO audit_log (outlet_id, actor, action, detail) VALUES (?, ?, ?, ?)')
      .bind(outletId, actor, action, detail)
      .run();
  } catch {
    // audit must never break the request
  }
}

// --- Hot order/customer persistence (best-effort; API works without it) ---

export interface OrderRecord {
  orderId: string;
  outletId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  block: string;
  room?: string;
  items: unknown[];
  subtotal: number;
  tax: number;
  packaging: number;
  grandTotal: number;
  payMode: string;
}

export async function saveOrderRecord(db: D1, o: OrderRecord): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO orders
       (order_id, outlet_id, customer_id, customer_name, phone, block, room, items_json, subtotal, tax, packaging, grand_total, pay_mode, pay_status, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending_staff_accept', '')`,
    )
    .bind(
      o.orderId, o.outletId, o.customerId ?? '', o.customerName, o.phone, o.block, o.room ?? '',
      JSON.stringify(o.items), o.subtotal, o.tax, o.packaging, o.grandTotal, o.payMode,
    )
    .run();
  if (o.customerId) {
    await db
      .prepare(
        `INSERT INTO customers (id, outlet_id, name, phone, block, room, pay_mode, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, phone = excluded.phone, block = excluded.block,
           room = excluded.room, pay_mode = excluded.pay_mode, last_seen = excluded.last_seen,
           success_count = success_count + 0`,
      )
      .bind(o.customerId, o.outletId, o.customerName, o.phone, o.block, o.room ?? '', o.payMode, Date.now())
      .run();
  }
}

// --- Readable exports (CSV / JSONL) with hard caps ---

export type ExportTable = 'orders' | 'customers' | 'audit_log';

export function exportFilename(table: ExportTable, format: 'csv' | 'jsonl', outletId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${table}-${outletId}-${day}.${format}`;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export function toJsonl(rows: Record<string, unknown>[]): string {
  return rows.map((r) => JSON.stringify(r)).join('\n');
}
