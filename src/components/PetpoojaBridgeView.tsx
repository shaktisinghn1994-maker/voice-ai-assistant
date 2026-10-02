import React, { useState } from 'react';
import { Copy, Check, Send, CheckCircle2 } from 'lucide-react';
import { RestaurantOutlet, VoiceOrderDraft } from '../types';
import { buildPetpoojaSaveOrderPayload } from '../utils/petpoojaPayload';

interface PetpoojaBridgeViewProps {
  outlets: RestaurantOutlet[];
  selectedOutletId: string;
  onSelectOutlet: (id: string) => void;
  onToggleItemStock: (outletId: string, itemId: string) => void;
}

export const PetpoojaBridgeView: React.FC<PetpoojaBridgeViewProps> = ({
  outlets,
  selectedOutletId,
  onSelectOutlet,
  onToggleItemStock,
}) => {
  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];
  const [copiedJson, setCopiedJson] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const sampleDraft: VoiceOrderDraft = {
    customerName: 'Rohan Sharma',
    customerPhone: '+91 98204 71829',
    isRepeatCustomer: true,
    deliveryAddress: 'Flat 402, Palm Grove Residency, 100ft Road, Indiranagar',
    landmark: 'Opposite Third Wave Coffee',
    locationPinStatus: 'repeat_saved',
    paymentMode: 'UPI_LINK',
    paymentStatus: 'paid',
    items: activeOutlet.menu
      .filter((m) => m.inStock)
      .slice(0, 2)
      .map((m) => ({
        item_id: m.item_id,
        item_name: m.name,
        variation_id: m.variations[0].variation_id,
        variation_name: m.variations[0].name,
        quantity: 2,
        unit_price: m.variations[0].price,
        addons: m.addons.slice(0, 1),
        total_price: m.variations[0].price * 2 + (m.addons[0]?.price || 0),
      })),
    subtotal: 640,
    cgst: 16,
    sgst: 16,
    packagingCharge: activeOutlet.packagingCharge,
    deliveryCharge: activeOutlet.deliveryCharge,
    grandTotal: 640 + 32 + activeOutlet.packagingCharge + activeOutlet.deliveryCharge,
    stage: 'ready_to_push',
    confidenceScore: 98,
  };

  const payload = buildPetpoojaSaveOrderPayload(activeOutlet, sampleDraft);
  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleTestPetpoojaWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/petpooja/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      setWebhookResult(
        `200 OK · ${data.kot_number} (${data.petpooja_order_id}) · Pushed ${data.received_payload_size} bytes to Petpooja POS at ${new Date(
          data.timestamp
        ).toLocaleTimeString()}`
      );
    } catch {
      setWebhookResult('Error testing webhook');
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Why Connect to Petpooja Instead of Rebuilding a POS */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="text-xs text-amber-400 font-medium">
          01. Direct POS Integration vs Building a Custom Billing App
        </div>
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight" style={{ textWrap: 'balance' }}>
          Keep Your Existing Petpooja Web POS — Push Voice Orders via the Save Order API
        </h1>
        <p className="text-sm text-slate-400 max-w-4xl leading-relaxed">
          Rebuilding GST billing, KOT thermal printing, recipe inventory, and Zomato/Swiggy reconciliation from scratch takes months. By connecting your Voice AI server directly to Petpooja’s <span className="text-slate-200 font-medium">Online Ordering API</span>, every phone order appears on the restaurant’s existing Petpooja screen automatically. Toggling an item out of stock below immediately instructs the AI to stop accepting that item on live phone calls.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Menu ID Mapping & Real-Time Stock Sync */}
        <div className="xl:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Petpooja Menu Mapping &amp; Live Stock Toggle
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle item availability below — out-of-stock items are immediately declined by the Voice AI
              </p>
            </div>

            <select
              value={activeOutlet.id}
              onChange={(e) => onSelectOutlet(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.petpoojaRestId})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/40">
                  <th className="py-3 px-4 font-medium">Petpooja ID</th>
                  <th className="py-3 px-4 font-medium">Menu Item &amp; Spoken Hinglish Aliases</th>
                  <th className="py-3 px-4 font-medium">Variations Mapped</th>
                  <th className="py-3 px-4 font-medium text-right">Stock State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {activeOutlet.menu.map((item) => (
                  <tr key={item.item_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-amber-300 whitespace-nowrap">
                      {item.item_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Spoken triggers: {item.hinglishAliases.join(' · ')} · {item.gstPercent}% GST
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono tabular-nums">
                      {item.variations.map((v) => `${v.name}: ₹${v.price} (${v.variation_id})`).join(' / ')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onToggleItemStock(activeOutlet.id, item.item_id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          item.inStock
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                        }`}
                      >
                        {item.inStock ? 'In Stock (Active)' : 'Out of Stock (Blocked)'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Live Save Order API JSON Payload & Webhook Test */}
        <div className="xl:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div>
              <div className="text-xs text-slate-400 font-mono">
                PETPOOJA SAVE ORDER API PAYLOAD
              </div>
              <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                Live JSON Sent on Call Confirmation
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleTestPetpoojaWebhook}
                disabled={testingWebhook}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingWebhook ? 'Sending...' : 'Test POS Push'}</span>
              </button>
            </div>
          </div>

          {webhookResult && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-700/60 rounded-lg text-xs text-emerald-300 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{webhookResult}</span>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 max-h-[420px] overflow-y-auto">
            <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
              {jsonString}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
