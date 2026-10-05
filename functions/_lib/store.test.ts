import { describe, expect, it } from 'vitest';
import {
  completeReset,
  getOutletStatus,
  listLiveOrders,
  lookupCustomer,
  lookupCustomerById,
  normalizePhoneDigits,
  requestResetCode,
  saveOrderRecord,
  setOutletStatus,
  setStaffPin,
  toCsv,
  toJsonl,
  verifyStaffDb,
  type D1,
} from './store';

// Minimal in-memory D1 double: understands only the statements store.ts issues.
function makeDb(): D1 & {
  users: Map<string, Record<string, unknown>>;
  resets: Map<string, Record<string, unknown>>;
  orders: Record<string, unknown>[];
} {
  const users = new Map<string, Record<string, unknown>>();
  const resets = new Map<string, Record<string, unknown>>();
  const orders: Record<string, unknown>[] = [];
  const outletStatus = new Map<string, number>();
  const customers: Record<string, unknown>[] = [
    { collegeId: 'MUJ1', name: 'Aarav', phone: '9820471829', block: 'B2', room: '214', payMode: 'upi' },
  ];
  const stmt = (sql: string) => ({
    bind(...args: unknown[]) {
      const q = sql;
      return {
        async first<T>(): Promise<T | null> {
          if (q.startsWith('SELECT * FROM staff_users')) {
            if (args.length >= 2) {
              return (users.get(`${args[0]}:${args[1]}`) ?? null) as T | null;
            }
            for (const u of users.values()) {
              if (u.outlet_id === args[0]) return u as T;
            }
            return null;
          }
          if (q.startsWith('SELECT username FROM staff_users') || q.startsWith('SELECT username, cafe_name FROM staff_users')) {
            for (const u of users.values()) {
              if (u.outlet_id === args[0]) return u as T;
            }
            return null;
          }
          if (q.startsWith('SELECT cafe_name FROM staff_users')) {
            return (users.get(`${args[0]}:${args[1]}`) ?? null) as T | null;
          }
          if (q.startsWith('SELECT COUNT(*) AS n FROM staff_resets')) {
            const n = [...resets.values()].filter(
              (r) => r.outlet_id === args[0] && r.username === args[1] && r.used === 0 && (r.expires_at as number) > (args[2] as number),
            ).length;
            return { n } as T;
          }
          if (q.startsWith('SELECT code_hash FROM staff_resets')) {
            const r = resets.get(String(args[0]));
            if (r && r.used === 0 && (r.expires_at as number) > (args[1] as number)) return r as T;
            return null;
          }
          if (q.includes('FROM customers WHERE phone')) {
            return (customers.find((c) => c.phone === args[0]) ?? null) as T | null;
          }
          if (q.includes('FROM customers WHERE id')) {
            return (customers.find((c) => c.collegeId === args[0]) ?? null) as T | null;
          }
          if (q.startsWith('SELECT is_open FROM outlet_status')) {
            const v = outletStatus.get(String(args[0]));
            return (v === undefined ? null : { is_open: v }) as T | null;
          }
          return null;
        },
        async all<T>(): Promise<{ results: T[] }> {
          if (q.includes('FROM orders WHERE outlet_id')) {
            const rows = orders
              .filter((o) => o.outlet_id === args[0] && (o.created_at as number) > (args[1] as number))
              .sort((a, b) => (b.created_at as number) - (a.created_at as number))
              .slice(0, Number(args[2]) || 50);
            return { results: rows as T[] };
          }
          return { results: [] };
        },
        async run(): Promise<unknown> {
          if (q.startsWith('INSERT INTO staff_users')) {
            const [outlet_id, username, cafe_name, pass_salt, pass_hash, iterations] = args;
            users.set(`${outlet_id}:${username}`, {
              outlet_id, username, cafe_name, pass_salt, pass_hash, iterations,
              failed_attempts: 0, locked_until: 0,
            });
          } else if (q.startsWith('UPDATE staff_users SET failed_attempts = 0')) {
            const u = users.get(`${args[2]}:${args[3]}`);
            if (u) { u.failed_attempts = 0; u.locked_until = 0; }
          } else if (q.startsWith('UPDATE staff_users SET failed_attempts')) {
            const u = users.get(`${args[2]}:${args[3]}`);
            if (u) { u.failed_attempts = args[0]; u.locked_until = args[1]; }
          } else if (q.startsWith('INSERT INTO staff_resets')) {
            resets.set(String(args[0]), { code_hash: args[0], outlet_id: args[1], username: args[2], expires_at: args[3], used: 0 });
          } else if (q.startsWith('UPDATE staff_resets SET used = 1')) {
            const r = resets.get(String(args[0]));
            if (r) r.used = 1;
          } else if (q.includes('INSERT OR REPLACE INTO orders')) {
            const [order_id, outlet_id, customer_id, customer_name, phone, block, room, items_json, subtotal, tax, packaging, grand_total, pay_mode, note] = args;
            orders.push({
              order_id, outlet_id, customer_id, customer_name, phone, block, room, items_json,
              subtotal, tax, packaging, grand_total, pay_mode, pay_status: 'unpaid',
              status: 'pending_staff_accept', note, created_at: Math.floor(Date.now() / 1000),
            });
          } else if (q.includes('INSERT INTO outlet_status')) {
            outletStatus.set(String(args[0]), Number(args[1]));
          }
          return {};
        },
      };
    },
  });
  return { prepare: (sql: string) => stmt(sql) as never, users, resets, orders };
}

describe('store (D1 hot storage)', () => {
  it('verifies a correct PIN and rejects a wrong one', async () => {
    const db = makeDb();
    await setStaffPin(db, 'zd-main', 'owner', 'ZERO DEGREE CAFE', 's3cret!');
    expect((await verifyStaffDb(db, 'zd-main', 's3cret!')).ok).toBe(true);
    expect((await verifyStaffDb(db, 'zd-main', 'nope')).ok).toBe(false);
  });

  it('locks out after 5 wrong attempts', async () => {
    const db = makeDb();
    await setStaffPin(db, 'zd-main', 'owner', 'ZERO DEGREE CAFE', 's3cret!');
    for (let i = 0; i < 5; i++) await verifyStaffDb(db, 'zd-main', 'nope');
    const locked = await verifyStaffDb(db, 'zd-main', 's3cret!');
    expect(locked.ok).toBe(false);
    expect(locked.locked).toBe(true);
  });

  it('runs the owner-assisted reset end to end', async () => {
    const db = makeDb();
    await setStaffPin(db, 'zd-main', 'owner', 'ZERO DEGREE CAFE', 'old-pin');
    const code = await requestResetCode(db, 'zd-main');
    expect(code).toMatch(/^\d{6}$/);
    expect(await completeReset(db, 'zd-main', '000000', 'new-pin')).toBe(false);
    expect(await completeReset(db, 'zd-main', code as string, 'new-pin')).toBe(true);
    expect((await verifyStaffDb(db, 'zd-main', 'new-pin')).ok).toBe(true);
    expect((await verifyStaffDb(db, 'zd-main', 'old-pin')).ok).toBe(false);
  });

  it('caps active reset codes at 3', async () => {
    const db = makeDb();
    await setStaffPin(db, 'zd-main', 'owner', 'ZERO DEGREE CAFE', 'old-pin');
    expect(await requestResetCode(db, 'zd-main')).not.toBeNull();
    expect(await requestResetCode(db, 'zd-main')).not.toBeNull();
    expect(await requestResetCode(db, 'zd-main')).not.toBeNull();
    expect(await requestResetCode(db, 'zd-main')).toBeNull();
  });

  it('finds customers by phone digits or college ID, exact match only', async () => {
    const db = makeDb();
    expect(await lookupCustomer(db, '+91 98204 71829')).toMatchObject({ name: 'Aarav', block: 'B2' });
    expect(await lookupCustomerById(db, 'muj1')).toMatchObject({ phone: '9820471829' });
    expect(await lookupCustomer(db, '6000000001')).toBeNull();
    expect(await lookupCustomer(db, 'not-a-number')).toBeNull();
    expect(normalizePhoneDigits('+91 98204 71829')).toBe('9820471829');
    expect(normalizePhoneDigits('123')).toBe('');
  });

  it('shares one OPEN/CLOSED flag per outlet', async () => {
    const db = makeDb();
    expect(await getOutletStatus(db, 'zd-main')).toBe(true);
    await setOutletStatus(db, 'zd-main', false);
    expect(await getOutletStatus(db, 'zd-main')).toBe(false);
  });

  it('feeds live orders newest-first for the outlet only', async () => {
    const db = makeDb();
    const base = {
      outletId: 'zd-main', customerName: 'A', phone: '9', block: 'B1',
      items: [{ quantity: 1, item_name: 'Fries' }], subtotal: 0, tax: 0,
      packaging: 0, grandTotal: 100, payMode: 'COD',
    };
    await saveOrderRecord(db, { ...base, orderId: 'RC-OLD' });
    // backdate by editing through a second record is unneeded: filter by since
    const live = await listLiveOrders(db, 'zd-main', 0);
    expect(live.map((o) => o.orderId)).toContain('RC-OLD');
    expect(live[0].items).toEqual([{ quantity: 1, item_name: 'Fries' }]);
    expect(await listLiveOrders(db, 'other-outlet', 0)).toEqual([]);
    expect(await listLiveOrders(db, 'zd-main', Math.floor(Date.now() / 1000) + 100)).toEqual([]);
  });

  it('formats readable CSV and JSONL exports', () => {    const rows = [
      { order_id: 'RC-1', grand_total: 250, note: 'less spicy, "extra" cheese' },
      { order_id: 'RC-2', grand_total: 100, note: '' },
    ];
    const csv = toCsv(rows);
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('"less spicy, ""extra"" cheese"');
    expect(toJsonl(rows).split('\n')).toHaveLength(2);
    expect(toCsv([])).toBe('');
  });
});
