import { ExportTable, exportFilename, toCsv, toJsonl } from '../../_lib/store';
import { PagesContext, json, readJson, requireStaff } from '../../_lib/api';

const TABLES: Record<ExportTable, { sql: (outlet: string) => string; args: (outlet: string, since: number) => unknown[] }> = {
  orders: {
    sql: () => 'SELECT * FROM orders WHERE outlet_id = ? AND created_at < ? ORDER BY created_at LIMIT ? OFFSET ?',
    args: (outlet, since) => [outlet, since],
  },
  customers: {
    sql: () => 'SELECT * FROM customers WHERE outlet_id = ? AND last_seen < ? ORDER BY last_seen LIMIT ? OFFSET ?',
    args: (outlet, since) => [outlet, since],
  },
  audit_log: {
    sql: () => 'SELECT * FROM audit_log WHERE outlet_id = ? AND created_at < ? ORDER BY created_at LIMIT ? OFFSET ?',
    args: (outlet, since) => [outlet, since],
  },
};

const ALLOWED: ExportTable[] = ['orders', 'customers', 'audit_log'];
const PAGE = 1000;
const MAX_ROWS = 5000;

// Export older-than rows as a readable file. Scoped to the caller's outlet.
export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const staff = await requireStaff(request, env);
  if (staff instanceof Response) return staff;
  if (!env.DB) return json({ error: 'Exports need the database binding.' }, 503);
  const body = await readJson(request);
  const table = body.table as ExportTable;
  const format = body.format === 'jsonl' ? 'jsonl' : 'csv';
  const olderThanDays = Number(body.olderThanDays);
  if (!ALLOWED.includes(table) || !Number.isFinite(olderThanDays) || olderThanDays < 7) {
    return json({ error: 'Pick orders, customers or audit_log with olderThanDays of 7 or more.' }, 400);
  }
  const since = Math.floor(Date.now() / 1000) - Math.floor(olderThanDays) * 86400;
  const def = TABLES[table];
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    const page = await env.DB.prepare(def.sql(table))
      .bind(...def.args(staff.outletId, since), PAGE, offset)
      .all<Record<string, unknown>>();
    rows.push(...page.results);
    if (page.results.length < PAGE) break;
  }
  const text = format === 'csv' ? toCsv(rows) : toJsonl(rows);
  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="${exportFilename(table, format, staff.outletId)}"`,
    },
  });
}
