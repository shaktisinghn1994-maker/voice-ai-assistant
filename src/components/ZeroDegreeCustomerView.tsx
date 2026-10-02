import { useCallback, useEffect, useState } from 'react';
import { HOSTEL_BLOCKS, ZERO_DEGREE_MENU, ZERO_DEGREE_OUTLET } from '../data/zeroDegreeData';
import { QROrder } from '../types';
import { findProfileById, saveProfile } from '../utils/savedProfiles';

interface CartLine {
  itemId: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
}

export const ZeroDegreeCustomerView: React.FC<{
  onOrderPlaced: (summary: string, orderObj?: QROrder) => void;
  onSwitchToStaff?: () => void;
}> = ({ onOrderPlaced, onSwitchToStaff }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [variantSel, setVariantSel] = useState<Record<string, string>>({});
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'card'>('upi');
  const [placed, setPlaced] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  const add = (key: string, line: CartLine) => {
    void line;
    setCart((p) => ({ ...p, [key]: (p[key] || 0) + 1 }));
  };
  const sub = (key: string) => {
    setCart((p) => {
      const n = (p[key] || 0) - 1;
      const c = { ...p };
      if (n <= 0) delete c[key];
      else c[key] = n;
      return c;
    });
  };

  const lines: (CartLine & { key: string })[] = [];
  ZERO_DEGREE_MENU.forEach((cat) => {
    cat.items.forEach((it) => {
      const sel = variantSel[it.id] ?? it.variants[0].label;
      const v = it.variants.find((x) => x.label === sel) || it.variants[0];
      const key = `${it.id}__${v.label}`;
      const qty = cart[key] || 0;
      if (qty > 0) lines.push({ key, itemId: it.id, name: it.name, variant: v.label, price: v.price, qty });
    });
  });
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const canOrder = isOpen && lines.length > 0 && name.trim().length >= 2 && block !== '';

  // Auto-fill when College ID matches a saved profile
  const lookupId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (trimmed.length < 3) {
      setWelcomeBack(null);
      setIdError(null);
      return;
    }
    const found = findProfileById(trimmed);
    if (found) {
      setName(found.name);
      setBlock(found.block);
      setRoom(found.room);
      setPayMode(found.payMode);
      setWelcomeBack(`Welcome back, ${found.name}! Details auto-filled. Edit if needed.`);
      setIdError(null);
    } else {
      setWelcomeBack(null);
    }
  }, []);

  useEffect(() => {
    if (collegeId.trim().length < 3) {
      setWelcomeBack(null);
      return;
    }
    const t = setTimeout(() => lookupId(collegeId), 400);
    return () => clearTimeout(t);
  }, [collegeId, lookupId]);

  // Close QR modal with Escape
  useEffect(() => {
    if (!showQRModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQRModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showQRModal]);

  const handleIdBlur = () => {
    if (!collegeId.trim()) return;
    const found = findProfileById(collegeId);
    if (!found && name.trim() && block) {
      // new ID, will be saved on order - no error
      setIdError(null);
    } else if (!found) {
      setIdError(null);
    }
  };

  const place = () => {
    if (!canOrder) return;
    const oid = `ZD-${Date.now().toString().slice(-6)}`;
    const cid = collegeId.trim().toUpperCase().replace(/\s+/g, '');
    const summary = `${oid} | ${name.trim()}${cid ? ' (' + cid + ')' : ''} | Block ${block}${room ? ' R' + room : ''} | ${lines.length} items Rs ${total} | ${payMode} (outside app)${note ? ' | ' + note : ''}`;

    // Save profile for next time if College ID given
    if (cid.length >= 3) {
      saveProfile({ collegeId: cid, name: name.trim(), block, room: room.trim(), payMode, lastUsed: Date.now() });
    }

    const orderObj: QROrder = {
      orderId: oid,
      outletId: 'zd-main',
      petpoojaRestId: ZERO_DEGREE_OUTLET.phone,
      customerPhone: '+91 9876543210',
      collegeId: cid || undefined,
      customerName: name.trim(),
      isRepeat: !!cid && !!welcomeBack,
      trustTier: 'repeat_verified',
      items: lines.map((l) => ({
        item_id: l.itemId,
        item_name: l.name,
        variation_id: l.variant,
        variation_name: l.variant,
        quantity: l.qty,
        unit_price: l.price,
        addons: [],
        total_price: l.price * l.qty,
      })),
      subtotal: total,
      cgst: Math.round(total * 0.025),
      sgst: Math.round(total * 0.025),
      packagingCharge: 10,
      deliveryCharge: 0,
      grandTotal: total + Math.round(total * 0.05) + 10,
      advancePaid: 0,
      paymentMode: payMode === 'upi' ? 'UPI_PREPAID' : payMode === 'cash' ? 'COD' : 'COUNTER',
      paymentStatus: payMode === 'upi' ? 'paid' : 'unpaid',
      status: 'pending_staff_accept',
      blockNumber: block,
      roomNo: room,
      instructions: note,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setPlaced(summary);
    onOrderPlaced(summary, orderObj);
  };

  const ctaLabel = !isOpen
    ? 'Closed - not taking orders'
    : lines.length === 0
      ? 'Add items to order'
      : !name.trim() || !block
        ? 'Fill Name + Block to complete'
        : `Place order • Rs ${total}`;

  return (
    <div className="zd-page min-h-screen pb-24 sm:pb-10">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Header - stacks on mobile */}
        <div className="zd-surface rounded-2xl overflow-hidden border border-[#2a2a2e]">
          <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-center leading-tight" style={{ color: '#111' }}>
                ZERO<br />DEGREE
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#f59e0b', color: '#111' }}>
                  {ZERO_DEGREE_OUTLET.name} - SIP & EAT
                </div>
                <div className="text-slate-200 text-[13px] sm:text-sm mt-1 leading-snug">{ZERO_DEGREE_OUTLET.address}</div>
                <div className="text-[11px] sm:text-xs font-mono" style={{ color: '#facc15' }}>For Delivery: {ZERO_DEGREE_OUTLET.phone} | {ZERO_DEGREE_OUTLET.hours}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowQRModal(true)}
                className="min-h-[44px] text-sm px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all"
                title="Scan QR on phone"
              >
                <span>📱</span>
                <span>Scan QR</span>
              </button>
              <button onClick={() => setIsOpen(!isOpen)} className="min-h-[44px] min-w-[88px] text-sm px-4 py-2.5 rounded-xl font-bold cursor-pointer active:scale-95 transition-all" style={{ background: isOpen ? '#16a34a' : '#ef4444', color: '#fff' }}>
                {isOpen ? '● OPEN' : 'CLOSED'}
              </button>
            </div>
          </div>
          {!isOpen && (
            <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl text-sm text-center font-semibold" style={{ background: '#3f1d1d', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              We are closed now and not taking delivery orders. Cart is saved, please come back in hours.
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {ZERO_DEGREE_MENU.map((cat) => (
            <section key={cat.title} className="rounded-2xl overflow-hidden border border-[#2a2a2e]" style={{ background: '#ffffff' }}>
              <div className="px-4 py-2.5 text-sm font-bold text-white" style={{ background: cat.color }}>{cat.title}</div>
              <div className="divide-y divide-slate-100">
                {cat.items.map((it) => {
                  const sel = variantSel[it.id] ?? it.variants[0].label;
                  const v = it.variants.find((x) => x.label === sel) || it.variants[0];
                  const key = `${it.id}__${v.label}`;
                  const qty = cart[key] || 0;
                  return (
                    <div key={it.id} className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span className="mt-1 shrink-0 inline-block w-3.5 h-3.5 rounded-sm border" style={{ borderColor: it.veg ? '#16a34a' : '#ef4444' }}>
                          <span className="block w-1.5 h-1.5 rounded-full mx-auto mt-[2px]" style={{ background: it.veg ? '#16a34a' : '#ef4444' }} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[15px] sm:text-sm font-semibold text-slate-900 leading-snug">{it.name} {it.tag ? <span className="text-[11px] text-amber-600">({it.tag})</span> : null}</div>
                          {it.variants.length > 1 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {it.variants.map((vv) => (
                                <button key={vv.label} onClick={() => setVariantSel((p) => ({ ...p, [it.id]: vv.label }))} className="min-h-[36px] text-xs px-3 py-1.5 rounded-full border cursor-pointer active:scale-95 transition-all" style={{ background: sel === vv.label ? '#111' : '#fff', color: sel === vv.label ? '#fff' : '#111', borderColor: '#ddd' }}>
                                  {vv.label} • Rs {vv.price}
                                </button>
                              ))}
                            </div>
                          )}
                          {it.variants.length === 1 && <div className="text-[13px] text-slate-600 font-mono mt-0.5">Rs {v.price}</div>}
                        </div>
                      </div>
                      <div className={`shrink-0 flex items-center gap-1.5 p-1 rounded-xl transition-all ${qty > 0 ? 'bg-amber-500/15 border border-amber-500/40 shadow-sm' : ''}`}>
                        <button
                          aria-label="Remove one"
                          onClick={() => sub(key)}
                          className="w-11 h-11 rounded-full bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 font-extrabold text-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 touch-manipulation"
                        >
                          −
                        </button>
                        <span
                          className={`min-w-[28px] text-center transition-all ${
                            qty > 0
                              ? 'bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full text-sm shadow-md border border-amber-300 scale-105'
                              : 'text-slate-400 font-mono text-sm font-semibold'
                          }`}
                        >
                          {qty}
                        </span>
                        <button
                          aria-label="Add one"
                          onClick={() => add(key, { itemId: it.id, name: it.name, variant: v.label, price: v.price, qty: 1 })}
                          className="w-11 h-11 rounded-full text-white font-extrabold text-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm touch-manipulation"
                          style={{ background: '#111' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Identity: College ID + Name + Block */}
        <div className="zd-surface mt-4 sm:mt-6 rounded-2xl p-4 sm:p-5 border border-[#2a2a2e]">
          <div className="text-[15px] sm:text-sm font-bold text-white">Your details</div>
          <div className="text-xs text-slate-400 mt-0.5">Repeat customer? Enter College ID once — details auto-fill next time.</div>

          <label htmlFor="zd-college-id" className="block text-xs font-semibold text-slate-300 mt-3 mb-1">College / Customer ID <span className="font-normal text-slate-500">(optional, e.g. MUJ2024001234)</span></label>
          <div className="flex gap-2">
            <input
              id="zd-college-id"
              name="collegeId"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              onBlur={handleIdBlur}
              placeholder="College ID - saved after 1st order…"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {collegeId && (
              <button
                onClick={() => { setCollegeId(''); setWelcomeBack(null); }}
                className="shrink-0 min-h-[48px] px-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold cursor-pointer active:scale-95"
              >
                Clear
              </button>
            )}
          </div>
          {welcomeBack && (
            <div role="status" aria-live="polite" className="mt-2 p-2.5 rounded-xl text-[13px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              ✅ {welcomeBack}
            </div>
          )}
          {idError && (
            <div role="alert" className="mt-2 p-2.5 rounded-xl text-[13px] bg-rose-950/60 border border-rose-800 text-rose-200">{idError}</div>
          )}
          {!welcomeBack && collegeId.trim().length >= 3 && (
            <div className="mt-2 text-[12px] text-slate-400">New ID — fill Name + Block below once, we will remember it on this phone.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            <div>
              <label htmlFor="zd-name" className="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
              <input id="zd-name" name="customerName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav…" autoComplete="name" className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="zd-block" className="block text-xs font-semibold text-slate-300 mb-1">Block *</label>
              <select id="zd-block" name="block" value={block} onChange={(e) => setBlock(e.target.value)} className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-amber-500 focus:outline-none min-h-[48px]">
                <option value="">Select Block *</option>
                {HOSTEL_BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="zd-room" className="block text-xs font-semibold text-slate-300 mb-1">Room</label>
              <input id="zd-room" name="room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 214…" inputMode="numeric" autoComplete="off" className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="zd-paymode" className="block text-xs font-semibold text-slate-300 mb-1">Pay mode</label>
              <select id="zd-paymode" name="payMode" value={payMode} onChange={(e) => setPayMode(e.target.value as 'cash' | 'upi' | 'card')} className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-amber-500 focus:outline-none min-h-[48px]">
                <option value="upi">UPI (pay outside app)</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          <label htmlFor="zd-note" className="block text-xs font-semibold text-slate-300 mt-2.5 mb-1">Note <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="zd-note" name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. thin crust, less spicy, call on arrival…" className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none" />
          <div className="mt-3 text-sm font-mono text-slate-300">Total Rs {total} • {lines.length} lines • Pay {payMode} outside app, staff will tick.</div>
          {/* Desktop / inline CTA */}
          <button onClick={place} disabled={!canOrder} className="hidden sm:block mt-3 w-full min-h-[48px] py-3 rounded-xl font-bold text-[15px] cursor-pointer disabled:opacity-40 active:scale-[0.99] transition-all" style={{ background: '#f59e0b', color: '#111' }}>
            {ctaLabel}
          </button>

          {placed && (
            <div role="status" aria-live="polite" className="mt-3 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 space-y-2">
              <div className="text-xs font-mono font-bold flex items-center justify-between gap-2">
                <span>✅ ORDER SENT TO STAFF KITCHEN QUEUE</span>
              </div>
              <div className="text-xs font-mono break-words">{placed}</div>
              {onSwitchToStaff && (
                <button
                  onClick={onSwitchToStaff}
                  className="mt-1 w-full min-h-[44px] py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl cursor-pointer transition-colors"
                >
                  👉 Open Staff Kitchen Queue
                </button>
              )}
            </div>
          )}

          <div className="mt-2 text-[11px] text-slate-500">Same link works for QR sticker and WhatsApp hi-menu. Orders land on Kitchen Display; staff punches into POS in 3s.</div>
        </div>
        <div className="h-6" />
      </div>

      {/* Sticky mobile order bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2" style={{ background: 'linear-gradient(to top, rgba(9,13,22,0.98) 70%, rgba(9,13,22,0))' }}>
        <div className="zd-surface rounded-2xl border border-amber-500/40 backdrop-blur px-3 py-2.5 flex items-center gap-3 shadow-2xl">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-slate-400 font-mono">{lines.length} items{collegeId ? ` • ${collegeId}` : ''}</div>
            <div className="text-lg font-black text-white leading-none">Rs {total}</div>
          </div>
          <button onClick={place} disabled={!canOrder} className="flex-1 min-h-[52px] rounded-xl font-bold text-[15px] cursor-pointer disabled:opacity-40 active:scale-[0.98] transition-all px-4" style={{ background: '#f59e0b', color: '#111' }}>
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ overscrollBehavior: 'contain' }}>
          <div role="dialog" aria-modal="true" aria-label="Menu QR code" className="zd-surface border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer font-bold"
              aria-label="Close QR code dialog"
            >
              ✕
            </button>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 mb-3">
              ZERO DEGREE MENU QR
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Scan with Mobile Phone</h3>
            <p className="text-[13px] text-slate-400 mb-4">
              Point your phone camera at this QR code to open the Zero Degree ordering menu directly on your phone.
            </p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.href : 'https://parallel-eats.app'
                )}&color=000000&bgcolor=ffffff`}
                alt="QR code linking to this ordering menu"
                width={208}
                height={208}
                loading="lazy"
                className="w-52 h-52 mx-auto"
              />
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Menu URL copied to clipboard!');
                }
              }}
              className="w-full min-h-[48px] py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-semibold rounded-xl text-sm cursor-pointer border border-slate-700"
            >
              📋 Copy Menu Web Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
