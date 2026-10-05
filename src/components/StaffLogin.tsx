import React, { useState } from 'react';
import { OUTLET_CREDENTIALS } from '../data/zeroDegreeData';
import { login } from '../utils/staffSession';

interface StaffLoginProps {
  onLogin: (outletId: string, cafeName: string) => void;
  onBack: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLogin, onBack }) => {
  const [outletId, setOutletId] = useState(OUTLET_CREDENTIALS[0]?.outletId ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await login(outletId, pin);
      setPin('');
      onLogin(session.outletId, session.cafeName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="zd-surface rounded-2xl border border-slate-800 p-5 sm:p-6">
        <h1 className="text-lg font-bold text-white">Staff login</h1>
        <p className="text-xs text-slate-400 mt-1">Pick your cafe and enter the staff PIN. Customers never see this screen.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="staff-outlet" className="block text-xs font-semibold text-slate-300 mb-1">Cafe name *</label>
            <select
              id="staff-outlet"
              name="outlet"
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-amber-500 focus:outline-none min-h-[48px]"
            >
              {OUTLET_CREDENTIALS.map((o) => (
                <option key={o.outletId} value={o.outletId}>{o.cafeName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="staff-pin" className="block text-xs font-semibold text-slate-300 mb-1">Staff PIN *</label>
            <input
              id="staff-pin"
              name="staffPin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter staff PIN…"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          {error && <div role="alert" className="p-2.5 rounded-xl text-[13px] bg-rose-950/60 border border-rose-800 text-rose-200">{error}</div>}
          <p className="text-[11px] text-slate-500">Forgot PIN? Ask a signed-in colleague to open Staff → PIN & Access and read you a reset code.</p>
          <button
            type="submit"
            disabled={pin.trim().length === 0 || busy}
            className="w-full min-h-[52px] py-3 rounded-xl font-bold text-[15px] cursor-pointer disabled:opacity-40 active:scale-[0.99] transition-all"
            style={{ background: '#f59e0b', color: '#111' }}
          >
            {busy ? 'Checking PIN…' : 'Open staff dashboard'}
          </button>
          <button type="button" onClick={onBack} className="w-full min-h-[44px] text-sm font-semibold text-slate-300 hover:text-slate-100 cursor-pointer">
            ← Back to ordering
          </button>
        </form>
      </div>
    </div>
  );
};
