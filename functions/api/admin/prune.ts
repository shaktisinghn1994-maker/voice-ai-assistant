import { ExportTable } from '../../_lib/store';
import { PagesContext, json, readJson, requireStaff } from '../../_lib/api';
import { audit } from '../../_lib/store';

const ALLOWED: ExportTable[] = ['orders', 'customers', 'audit_log'];
const CHUNK = 500;

// Delete exported rows in small chunks. Requires the exact confirm string
// "DELETE <table> <outletId>" so it can never fire by accident.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (!env.DB) return json({ error: 'Pruning needs the database binding.' }, 503);
  const body = await readJson(request);
  const table = body.table as ExportTable;
  const olderThanDays = Number(body.olderThanDays);
  const confirm = body.confirm;
  if (!ALLOWED.includes(table) || !Number.isFinite(olderThanDays) || olderThanDays < 7) {
    return json({ error: 'Pick orders, customers or audit_log with olderThanDays of 7 or more.' }, 400);
  }
  if (confirm !== `DELETE ${table} ${staff.outletId}`) {
    return json({ error: 'Type the exact confirm phrase shown to prune. Export first.' }, 400);
  }
  const since = Math.floor(Date.now() / 1000) - Math.floor(olderThanDays) * 86400;
  const column = table === 'customers' ? 'last_seen' : 'created_at';
  let deleted = 0;
  for (;;) {
    const ids = await env.DB.prepare(
      `SELECT ${table === 'audit_log' ? 'id' : table === 'orders' ? 'order_id' : 'id'} AS id FROM ${table} WHERE outlet_id = ? AND ${column} < ? LIMIT ?`,
    )
      .bind(staff.outletId, since, CHUNK)
      .all<{ id: string | number }>();
    if (ids.results.length === 0) break;
    const placeholders = ids.results.map(() => '?').join(',');
    const idCol = table === 'audit_log' ? 'id' : table === 'orders' ? 'order_id' : 'id';
    await env.DB.prepare(`DELETE FROM ${table} WHERE ${idCol} IN (${placeholders})`)
      .bind(...ids.results.map((r) => r.id))
      .run();
    deleted += ids.results.length;
    if (ids.results.length < CHUNK) break;
  }
  await audit(env.DB, staff.outletId, staff.outletId, 'admin.prune', `${table} older-than ${olderThanDays}d: ${deleted} rows`);
  return json({ ok: true, deleted });
}
