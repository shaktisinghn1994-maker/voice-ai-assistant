import { useState } from 'react';
import { RESTAURANT_OUTLETS, SAVED_CUSTOMERS } from '../data/cafeData';
import { OrderLineItem, QROrder, VoiceOrderDraft } from '../types';
import { decideTrust, normalizePhone } from '../utils/customerTrust';
import { buildPetpoojaSaveOrderPayload } from '../utils/petpoojaPayload';
import { findProfileById, saveProfile } from '../utils/savedProfiles';

interface CartQty {
  [key: string]: number;
}

export const QROrderView: React.FC<{
  selectedOutletId: string;
  onSelectOutlet: (id: string) => void;
  onOrderCreated: (order: QROrder) => void;
}> = ({ selectedOutletId, onSelectOutlet, onOrderCreated }) => {
  const outlet = RESTAURANT_OUTLETS.find((o) => o.id === selectedOutletId) || RESTAURANT_OUTLETS[0];
  const [phone, setPhone] = useState('+91 98204 71829');
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [instructions, setInstructions] = useState('');
  const [cart, setCart] = useState<CartQty>({ [outlet.menu[0].item_id]: 1 });
  const [lastOrder, setLastOrder] = useState<QROrder | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const lookupCollegeId = (id: string) => {
    const found = findProfileById(id);
    if (found) {
      setName(found.name);
      setBlockNumber(found.block);
      setRoomNo(found.room);
    }
  };

  const setQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[itemId];
      else copy[itemId] = next;
      return copy;
    });
  };

  const items: OrderLineItem[] = Object.entries(cart)
    .map(([itemId, qty]) => {
      const m = outlet.menu.find((x) => x.item_id === itemId);
      if (!m || !m.inStock) return null;
      const v = m.variations[0];
      return {
        item_id: m.item_id,
        item_name: m.name,
        variation_id: v.variation_id,
        variation_name: v.name,
        quantity: qty,
        unit_price: v.price,
        addons: [],
        total_price: v.price * qty,
      };
    })
    .filter(Boolean) as OrderLineItem[];

  const subtotal = items.reduce((s, i) => s + i.total_price, 0);
  const cgst = Math.round(subtotal * 0.025);
  const sgst = Math.round(subtotal * 0.025);
  const grandTotal = subtotal + cgst + sgst + outlet.packagingCharge + outlet.deliveryCharge;

  const profile = SAVED_CUSTOMERS.find((c) => normalizePhone(c.phone) === normalizePhone(phone));
  const trust = decideTrust(profile, grandTotal);

  const placeOrder = async () => {
    if (items.length === 0 || !phone.trim()) return;
    if (!name.trim() || !blockNumber.trim()) {
      setFormError('Order incomplete: Name + Block number required. e.g. Name: Aarav, Block: B-214.');
      return;
    }
    setFormError(null);
    const cid = collegeId.trim().toUpperCase().replace(/\s+/g, '');
    if (cid.length >= 3) {
      saveProfile({ collegeId: cid, name: name.trim(), block: blockNumber.trim(), room: roomNo.trim(), payMode: 'upi', lastUsed: Date.now() });
    }
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outletId: outlet.id,
        customerPhone: phone,
        collegeId: cid || undefined,
        customerName: name.trim(),
        blockNumber: blockNumber.trim(),
        roomNo: roomNo.trim(),
        instructions: instructions.trim(),
        items,
        grandTotal,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || 'Order rejected. Fill Name + Block number.');
      return;
    }
    const order: QROrder = {
      orderId: data.orderId || `RC-${Date.now().toString().slice(-6)}`,
      outletId: outlet.id,
      petpoojaRestId: outlet.petpoojaRestId,
      customerPhone: phone,
      collegeId: cid || undefined,
      customerName: name,
      isRepeat: !!profile,
      trustTier: data.trustTier || trust.tier,
      items,
      subtotal,
      cgst,
      sgst,
      packagingCharge: outlet.packagingCharge,
      deliveryCharge: outlet.deliveryCharge,
      grandTotal,
      advancePaid: 0,
      paymentMode: trust.allowCOD ? 'COD' : 'UPI_PREPAID',
      paymentStatus: 'unpaid',
      status: 'pending_pay',
      blockNumber: blockNumber.trim(),
      roomNo: roomNo.trim(),
      instructions: instructions.trim(),
      deliveryAddress: `Block ${blockNumber.trim()}${roomNo.trim() ? ', Room ' + roomNo.trim() : ''}`,
      createdAt: new Date().toISOString(),
    };
    setLastOrder(order);
    onOrderCreated(order);
  };

  const payloadPreview = buildPetpoojaSaveOrderPayload(outlet, {
    customerName: name || 'Hostel Student',
    customerPhone: phone,
    isRepeatCustomer: !!profile,
    deliveryAddress: `Block ${blockNumber || '[MISSING]'}, Room ${roomNo || '-'}${instructions ? ' | Note: ' + instructions : ''}`,
    landmark: `Hostel Block ${blockNumber || '[MISSING]'}`,
    locationPinStatus: profile ? 'repeat_saved' : 'pending_whatsapp_pin',
    paymentMode: trust.allowCOD ? 'COD' : 'UPI_LINK',
    paymentStatus: 'pending',
    items,
    subtotal,
    cgst,
    sgst,
    packagingCharge: outlet.packagingCharge,
    deliveryCharge: outlet.deliveryCharge,
    grandTotal,
    stage: 'ready_to_push',
    confidenceScore: 95,
  } satisfies VoiceOrderDraft);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <div className="xl:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="text-xs text-amber-400 font-medium">01. HOSTEL QR - NAME + BLOCK REQUIRED (NO OUTSIDE DELIVERY)</div>
        <h2 className="text-lg font-semibold text-slate-100">Scan - Cart - Name/Block - Pay - KOT</h2>
        <div className="text-xs text-slate-500 font-mono">Forget 40 restaurants. Hostel mode: 1 campus, 3-4 outlets, delivery by Block batch.</div>
        <select
          value={outlet.id}
          onChange={(e) => onSelectOutlet(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
        >
          {RESTAURANT_OUTLETS.map((o) => (
            <option key={o.id} value={o.id}>{o.name} ({o.petpoojaRestId})</option>
          ))}
        </select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <input aria-label="College ID - repeat customers auto-fill" value={collegeId} onChange={(e) => { const v = e.target.value.toUpperCase().replace(/\s+/g, ''); setCollegeId(v); if (v.length >= 3) lookupCollegeId(v); }} placeholder="College ID (repeat? auto-fill)" autoComplete="off" spellCheck={false} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 font-mono min-h-[44px]" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (OTP verified)" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name * (required)" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100" />
          <select value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100">
            <option value="">Block * (required)</option>
            <option value="A">Block A</option>
            <option value="B">Block B</option>
            <option value="C">Block C</option>
            <option value="D">Block D</option>
            <option value="E">Block E</option>
            <option value="Mess">Mess / Canteen pickup</option>
          </select>
          <input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="Room No (e.g. 214)" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100" />
        </div>
        <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions (e.g. less spicy, call on arrival, extra chutney)" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" />
        {formError && <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-lg text-xs">{formError}</div>}
        <div className="space-y-2">
          {outlet.menu.map((m) => (
            <div key={m.item_id} className="flex items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
              <div>
                <div className="text-slate-100 font-medium">{m.name} - Rs {m.variations[0].price}</div>
                <div className="text-xs text-slate-500 font-mono">{m.item_id} {m.inStock ? '' : '- OUT OF STOCK'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(m.item_id, -1)} disabled={!m.inStock} className="px-2 py-1 bg-slate-800 rounded text-slate-200 cursor-pointer disabled:opacity-30">-</button>
                <span className="font-mono text-slate-100 w-6 text-center">{cart[m.item_id] || 0}</span>
                <button onClick={() => setQty(m.item_id, 1)} disabled={!m.inStock} className="px-2 py-1 bg-slate-800 rounded text-slate-200 cursor-pointer disabled:opacity-30">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="xl:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="text-xs text-emerald-400 font-mono">TRUST CHECK - REPEAT vs NEW</div>
        <div className={`p-3 rounded-lg border text-xs ${trust.tier === 'repeat_verified' ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300' : 'bg-amber-950/40 border-amber-700/50 text-amber-200'}`}>
          {trust.tier === 'repeat_verified' ? 'Repeat verified: COD allowed, direct KOT.' : trust.reason}
          {!trust.allowCOD && <div className="mt-1 font-mono">Advance required: Rs {trust.requireAdvance} {trust.requirePrepaidFull ? '(full prepaid)' : ''}</div>}
        </div>
        <div className="text-xs font-mono text-slate-400 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>Rs {subtotal}</span></div>
          <div className="flex justify-between"><span>CGST+SGST 5%</span><span>Rs {cgst + sgst}</span></div>
          <div className="flex justify-between"><span>Packing+Delivery</span><span>Rs {outlet.packagingCharge + outlet.deliveryCharge}</span></div>
          <div className="flex justify-between text-sm font-semibold text-amber-300"><span>Total</span><span>Rs {grandTotal}</span></div>
        </div>
        <button onClick={placeOrder} disabled={items.length === 0 || !name.trim() || !blockNumber.trim()} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer">
          {!name.trim() || !blockNumber.trim() ? 'Fill Name + Block to complete order' : `Place QR Order - ${trust.allowCOD ? 'COD / Pay at counter' : 'UPI Prepaid link'}`}
        </button>
        {lastOrder && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            Created {lastOrder.orderId} - {lastOrder.status} - unpaid. Staff must Accept, then verify payment webhook before KOT. Track: /o/{lastOrder.orderId}
          </div>
        )}
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">Petpooja payload preview (pushed only after paid/accepted)</summary>
          <pre className="mt-2 max-h-48 overflow-auto font-mono text-[11px]">{JSON.stringify(payloadPreview.orderinfo.OrderInfo.Order.details, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};
