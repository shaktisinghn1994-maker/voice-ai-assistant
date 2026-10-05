/* eslint-disable no-undef */
// Prints SQL that seeds the default staff login. Run once, then paste into:
//   npx wrangler d1 execute parallel-eats-db --remote --command "<sql>"
// Change the PIN afterwards with the reset flow or by re-running with a new PIN.
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const pin = process.argv[2] || 'zero-g1-2026';
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(pin, Buffer.from(salt, 'hex'), 60000, 32, 'sha256').toString('hex');
console.log(
  `INSERT INTO staff_users (outlet_id, username, cafe_name, pass_salt, pass_hash, iterations) VALUES ('zd-main', 'owner', 'ZERO DEGREE CAFE', '${salt}', '${hash}', 60000) ON CONFLICT(outlet_id, username) DO UPDATE SET pass_salt = excluded.pass_salt, pass_hash = excluded.pass_hash, iterations = excluded.iterations, failed_attempts = 0, locked_until = 0;`,
);
