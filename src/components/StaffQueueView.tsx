import { useState } from 'react';
import { QROrder } from '../types';

// Delete guard: shared PIN for now so orders can't vanish by a mis-tap.
// Later: per-staff password + confirm dialog (see PLAN).
const DELETE_PIN = '1234';

export const StaffQueueView: React.FC<{
  orders: QROrder[];
  onUpdate: (id: string, patch: Partial<QROrder>) => void;
  onDelete: (id: string) => void;
}> = ({ orders, onUpdate, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'ready'>('all');
  const [deleteFor, setDeleteFor] = useState<string | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      // clipboard unavailable - staff can still read and type it
    }
  };

  const confirmDelete = (o: QROrder) => {
    if (deletePin.trim() === DELETE_PIN) {
      onDelete(o.orderId);
      setDeleteFor(null);
      setDeletePin('');
      setDeleteError(null);
    } else {
      setDeleteError('Wrong PIN. Ask the owner for the delete PIN.');
    }
  };

  const statusLabel = (o: QROrder): string => {
    switch (o.status) {
      case 'pending_pay':
      case 'pending_staff_accept':
        return 'New';
      case 'accepted':
        return 'Accepted';
      case 'pushed_to_petpooja':
        return 'Punched';
      case 'preparing':
        return 'Preparing';
      case 'dispatched':
        return 'Dispatched';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return o.status;
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
          <div key={o.orderId} className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3 text-[15px] hover:bg-slate-800/30 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="text-slate-100 font-semibold font-mono flex flex-wrap items-center gap-2 text-base">
                <span className="text-amber-400 font-bold">{o.orderId}</span>
                <span>• Rs {o.grandTotal}</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">Block {o.blockNumber || '?'} {o.roomNo ? `R-${o.roomNo}` : ''}</span>
                <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-xs font-bold">{statusLabel(o)}</span>
              </div>
              <div className="text-[15px] text-slate-200 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">{o.customerName}</span>
                <button
                  onClick={() => copyText(`${o.orderId}-name`, o.customerName)}
                  aria-label={`Copy customer name ${o.customerName}`}
                  title="Copy name"
                  className="text-xs px-2 py-1 min-h-[32px] rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {copied === `${o.orderId}-name` ? '✓ Copied' : '⧉ Name'}
                </button>
                <span className="font-mono">{o.customerPhone}</span>
                <button
                  onClick={() => copyText(`${o.orderId}-phone`, o.customerPhone)}
                  aria-label={`Copy phone number ${o.customerPhone}`}
                  title="Copy number"
                  className="text-xs px-2 py-1 min-h-[32px] rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {copied === `${o.orderId}-phone` ? '✓ Copied' : '⧉ Number'}
                </button>
                {o.collegeId && <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded font-mono text-xs">ID {o.collegeId}</span>}
              </div>
              <div className="text-[15px] text-slate-300 mt-1">
                {o.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                {o.instructions && <span className="text-amber-300 font-semibold"> • Note: {o.instructions}</span>}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>• Pay: <span className="uppercase text-slate-200 font-mono">{o.paymentMode}</span></span>
                <span className={`font-bold ${o.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-rose-400'}`}>[{o.paymentStatus}]</span>
                <span className="text-amber-300 font-mono">{o.status} {o.kotNumber ? `(${o.kotNumber})` : ''}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => manualOption1Punch(o)}
                className="px-3 py-2 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                title="You punched this order into the Petpooja screen yourself"
              >
                ✓ Punched
              </button>
              {o.paymentStatus === 'unpaid' && (
                <button onClick={() => verifyPayment(o)} className="px-3 py-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 cursor-pointer">Simulate Paid</button>
              )}
              <button onClick={() => pushKot(o)} disabled={o.paymentStatus === 'unpaid'} className="px-3 py-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-30">Auto KOT</button>
              <button
                onClick={() => onUpdate(o.orderId, { status: 'preparing' })}
                disabled={o.status !== 'pushed_to_petpooja' && o.status !== 'accepted'}
                className="px-3 py-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 cursor-pointer disabled:opacity-30"
              >
                Preparing
              </button>
              <button onClick={() => onUpdate(o.orderId, { status: 'dispatched' })} disabled={o.status !== 'pushed_to_petpooja' && o.status !== 'preparing'} className="px-3 py-2 min-h-[44px] bg-slate-800 text-slate-200 rounded-lg border border-slate-700 cursor-pointer disabled:opacity-30">Dispatched</button>
              <button onClick={() => onUpdate(o.orderId, { status: 'cancelled' })} className="px-3 py-2 min-h-[44px] bg-slate-800 text-rose-300 hover:bg-rose-950/40 rounded-lg border border-slate-700 cursor-pointer">Cancel</button>
              {deleteFor === o.orderId ? (
                <span className="flex items-center gap-1.5">
                  <input
                    type="password"
                    value={deletePin}
                    onChange={(e) => setDeletePin(e.target.value)}
                    placeholder="Delete PIN…"
                    aria-label={`Delete PIN for order ${o.orderId}`}
                    autoComplete="off"
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 min-h-[44px] text-xs text-slate-100 focus:outline-none focus:border-rose-400"
                  />
                  <button onClick={() => confirmDelete(o)} className="px-3 py-2 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer">Delete</button>
                  <button onClick={() => { setDeleteFor(null); setDeletePin(''); setDeleteError(null); }} aria-label="Cancel delete" className="px-3 py-2 min-h-[44px] bg-slate-800 text-slate-300 rounded-lg cursor-pointer">✕</button>
                </span>
              ) : (
                <button onClick={() => { setDeleteFor(o.orderId); setDeletePin(''); setDeleteError(null); }} className="px-3 py-2 min-h-[44px] bg-slate-800 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 cursor-pointer">Delete</button>
              )}
            </div>
            {deleteFor === o.orderId && deleteError && (
              <div role="alert" className="w-full text-xs text-rose-300">{deleteError}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

