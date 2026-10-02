import { useState } from 'react';

const QR_LINK = 'https://your-domain/qr?outlet=hostel-canteen-1';
const MENU = ['Paneer Roll Rs 150', 'Cold Coffee Rs 140', 'Peri-Peri Fries Rs 130', 'Maggi Double Rs 165'];

export const WhatsAppFlowView: React.FC = () => {
  const [inText, setInText] = useState('hi');
  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [reply, setReply] = useState<string | null>(null);

  const handleIncoming = async () => {
    const res = await fetch('/api/whatsapp/incoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: '+91-student', text: inText, name, blockNumber: block }),
    });
    const data = await res.json();
    setReply(data.replyText);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="text-xs text-amber-400 font-medium">WHATSAPP HOSTEL - HI TO QR LINK FLOW</div>
        <h2 className="text-lg font-semibold text-slate-100">Hi - Menu + QR link - Name + Block dropdown</h2>
        <div className="text-sm text-slate-400">
          Any hi/hello/message triggers Step 1. Same QR page link is sent, so WhatsApp and QR share one cart.
        </div>
        <label className="block text-xs text-slate-400">1. Student sends (try hi):</label>
        <input value={inText} onChange={(e) => setInText(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">2. Name (free text):</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">3. Block (dropdown):</label>
            <select value={block} onChange={(e) => setBlock(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100">
              <option value="">Select Block *</option>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
              <option value="D">Block D</option>
              <option value="E">Block E</option>
              <option value="Mess">Mess pickup</option>
            </select>
          </div>
        </div>
        <button onClick={handleIncoming} className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-semibold rounded-lg cursor-pointer">Simulate incoming WhatsApp</button>
        {reply && <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-line">{reply}</div>}
      </div>
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="text-xs text-emerald-400 font-medium">BOT SCRIPT (2 TEMPLATES MAX)</div>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-line">
          {'Step1 on hi/anything:\nNamaste! Select order:\n[1] Paneer Roll Rs150 [2] Cold Coffee Rs140 [3] Fries Rs130 [4] Maggi Rs165\nOr order fast here: ' + QR_LINK + '\n\nStep2: Send Name (type) + Block (tap A/B/C/D/E/Mess) + Note if any.\n\nStep3 bill+UPI+YES, Step4 dispatched to Block gate. No KOT until Name+Block filled.'}
        </div>
        <div className="text-xs font-mono text-slate-500">Menu list: {MENU.join(' | ')}. QR link same as QROrderView cart. One backend, two entries.</div>
      </div>
    </div>
  );
};
