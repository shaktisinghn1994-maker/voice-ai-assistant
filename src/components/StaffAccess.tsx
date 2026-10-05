import React, { useState } from 'react';
import { getSession } from '../utils/staffSession';

// PIN & access: a signed-in staff member generates a one-time reset code and
// reads it to the locked-out colleague in person. Nothing is sent anywhere.
export const StaffAccess: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = getSession()?.token ?? '';
  const outletId = getSession()?.outletId ?? '';

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  const generate = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/staff/request-reset', { method: 'POST', headers: authHeaders() });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error ?? 'Could not generate a code.');
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a code.');
    } finally {
      setBusy(false);
    }
  };

  const complete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/staff/complete-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outletId, code, newPin }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Reset failed.');
      setMessage('PIN updated. The old code is now burnt — sign in with the new PIN.');
      setCode(null);
      setNewPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4 max-w-xl">
      <div>
        <div className="text-xs text-amber-400 font-medium">PIN &amp; ACCESS</div>
        <h2 className="text-lg font-semibold text-slate-100">Reset a staff PIN</h2>
        <p className="text-xs text-slate-400 mt-1">Locked out? A signed-in colleague generates a 6-digit code, reads it to you in person, and you set a new PIN here within 15 minutes. Codes are single-use.</p>
      </div>
      {!code ? (
        <button
          onClick={generate}
          disabled={busy || !token}
          className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-40"
          style={{ background: '#f59e0b', color: '#111' }}
        >
          {busy ? 'Working…' : 'Generate reset code'}
        </button>
      ) : (
        <form onSubmit={complete} className="space-y-3">
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-center">
            <div className="text-[11px] font-mono text-amber-300">ONE-TIME CODE — VALID 15 MIN</div>
            <div className="text-3xl font-black font-mono tracking-[0.3em] text-amber-300">{code}</div>
          </div>
          <div>
            <label htmlFor="reset-new-pin" className="block text-xs font-semibold text-slate-300 mb-1">New PIN (4+ characters) *</label>
            <input
              id="reset-new-pin"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New staff PIN…"
              autoComplete="off"
              className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || newPin.trim().length < 4}
            className="w-full min-h-[48px] rounded-xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{ background: '#f59e0b', color: '#111' }}
          >
            {busy ? 'Working…' : 'Set new PIN'}
          </button>
        </form>
      )}
      {message && <div role="status" className="p-2.5 rounded-xl text-[13px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">{message}</div>}
      {error && <div role="alert" className="p-2.5 rounded-xl text-[13px] bg-rose-950/60 border border-rose-800 text-rose-200">{error}</div>}
    </div>
  );
};
