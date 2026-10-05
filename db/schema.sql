-- Parallel Eats hot storage (Cloudflare D1, free tier).
-- Small rows, indexed lookups only. Cold history lives in R2 exports, not here.

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,            -- college ID uppercased, or phone-based id
  outlet_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  block TEXT NOT NULL,
  room TEXT DEFAULT '',
  pay_mode TEXT DEFAULT 'upi',
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  blacklisted INTEGER DEFAULT 0,
  last_seen INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_outlet ON customers(outlet_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL,
  customer_id TEXT DEFAULT '',
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  block TEXT NOT NULL,
  room TEXT DEFAULT '',
  items_json TEXT NOT NULL,        -- line items as JSON (keeps rows small)
  subtotal INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  packaging INTEGER DEFAULT 0,
  grand_total INTEGER DEFAULT 0,
  pay_mode TEXT DEFAULT 'UPI_PREPAID',
  pay_status TEXT DEFAULT 'unpaid',
  status TEXT DEFAULT 'pending_staff_accept',
  note TEXT DEFAULT '',
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_time ON orders(outlet_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Staff accounts: salted slow hashes only, never plaintext PINs/passwords.
CREATE TABLE IF NOT EXISTS staff_users (
  outlet_id TEXT NOT NULL,
  username TEXT NOT NULL,
  cafe_name TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  iterations INTEGER DEFAULT 60000,
  failed_attempts INTEGER DEFAULT 0,
  locked_until INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  PRIMARY KEY (outlet_id, username)
);

-- Single-use reset codes (hashed). Owner reads the code off-screen and tells staff.
CREATE TABLE IF NOT EXISTS staff_resets (
  code_hash TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL,
  username TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_resets_outlet ON staff_resets(outlet_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_id TEXT DEFAULT '',
  actor TEXT DEFAULT '',
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_outlet_time ON audit_log(outlet_id, created_at);
