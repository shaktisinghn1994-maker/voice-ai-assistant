import { useState } from 'react';
import { QROrder } from '../types';

export const StaffQueueView: React.FC<{
  orders: QROrder[];
  onUpdate: (id: string, patch: Partial<QROrder>) => void;
}> = ({ orders, onUpdate }) => {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'ready'>('all');

  const list = [...orders]
    .filter((o) => {
      if (filter === 'unpaid') return o.paymentStatus === 'unpaid';
      if (filter === 'ready') return o.paymentStatus !== 'unpaid' && o.status !== 'dispatched';
      return true;
    })
    .sort((a, b) => (a.blockNumber || '').localeCompare(b.blockNumber || ''));

  const verifyPayment = async (o: QROrder) => {
    try {
      const res = await fetch('/api/orders/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.orderId, razorpayPaymentId: 'pay_mock_' + Date.now() }),
      });
      const data = await res.json();
      if (data.verified) {
        onUpdate(o.orderId, { paymentStatus: 'paid', status: 'accepted' });
      } else {
        onUpdate(o.orderId, { paymentStatus: 'paid', status: 'accepted' });
      }
    } catch {
      onUpdate(o.orderId, { paymentStatus: 'paid', status: 'accepted' });
    }
  };

  const manualOption1Punch = (o: QROrder) => {
    const kotNum = `KOT-${Math.floor(100 + Math.random() * 900)}`;
    onUpdate(o.orderId, {
      paymentStatus: 'paid',
      status: 'pushed_to_petpooja',
      kotNumber: kotNum,
    });
  };

  const pushKot = async (o: QROrder) => {
    if (o.paymentStatus === 'unpaid') return;
    try {
      const res = await fetch('/api/petpooja/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { orderId: o.orderId, total: o.grandTotal } }),
      });
      const data = await res.json();
      onUpdate(o.orderId, { status: 'pushed_to_petpooja', kotNumber: data.kot_number });
    } catch {
      manualOption1Punch(o);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-amber-400 font-bold tracking-wide flex items-center gap-2">
            <span>⚡ OPTION 1 LIVE KITCHEN DISPLAY</span>
            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">Zero Petpooja Permission Needed</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100 mt-1">
            Orders land live. Staff ticks & punches into Petpooja POS screen in 3 seconds.
          </h2>
        </div>
        <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          {(['all', 'unpaid', 'ready'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md cursor-pointer ${filter === f ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-800/60">
        {list.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            <div>No active orders in queue.</div>
            <div className="text-xs text-slate-500 mt-1">Place an order on the Customer Page or scan the QR code to test!</div>
          </div>
        )}
        {list.map((o) => (
          <div key={o.orderId} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-slate-800/30 transition-colors">
            <div>
              <div className="text-slate-100 font-medium font-mono flex items-center gap-2">
                <span className="text-amber-400 font-bold">{o.orderId}</span>
                <span>• Rs {o.grandTotal}</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">Block {o.blockNumber || '?'} {o.roomNo ? `R-${o.roomNo}` : ''}</span>
                <span className="text-slate-300">({o.customerName})</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                {o.collegeId && <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded font-mono">ID {o.collegeId}</span>}
                <span>{o.customerPhone}</span>
                <span>• {o.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}</span>
                {o.instructions && <span className="text-amber-300 font-semibold">• Note: {o.instructions}</span>}
                <span>• Pay: <span className="uppercase text-slate-200 font-mono">{o.paymentMode}</span></span>
                <span className={`font-bold ${o.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-rose-400'}`}>[{o.paymentStatus}]</span>
                <span className="text-amber-300 font-mono">{o.status} {o.kotNumber ? `(${o.kotNumber})` : ''}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => manualOption1Punch(o)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                title="Staff ticks order & punches into POS manually (3s)"
              >
                ✓ Tick & Punch to POS (Option 1)
              </button>
              {o.paymentStatus === 'unpaid' && (
                <button onClick={() => verifyPayment(o)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 cursor-pointer">Simulate Paid</button>
              )}
              <button onClick={() => pushKot(o)} disabled={o.paymentStatus === 'unpaid'} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-30">Auto KOT</button>
              <button onClick={() => onUpdate(o.orderId, { status: 'dispatched' })} disabled={o.status !== 'pushed_to_petpooja'} className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 cursor-pointer disabled:opacity-30">Dispatched</button>
              <button onClick={() => onUpdate(o.orderId, { status: 'cancelled' })} className="px-3 py-1.5 bg-slate-800 text-rose-300 hover:bg-rose-950/40 rounded-lg border border-slate-700 cursor-pointer">Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

