import React, { Suspense, lazy, useState } from 'react';
import { ClipboardList, QrCode, MessageCircle, Store, Wallet, LogOut } from 'lucide-react';
import { QROrder, RestaurantOutlet } from '../types';

// Code-split like App: staff sections load on demand, never in the customer bundle.
const QROrderView = lazy(() => import('./QROrderView').then((m) => ({ default: m.QROrderView })));
const StaffQueueView = lazy(() => import('./StaffQueueView').then((m) => ({ default: m.StaffQueueView })));
const WhatsAppFlowView = lazy(() => import('./WhatsAppFlowView').then((m) => ({ default: m.WhatsAppFlowView })));
const PetpoojaBridgeView = lazy(() => import('./PetpoojaBridgeView').then((m) => ({ default: m.PetpoojaBridgeView })));
const BlueprintAndEmailView = lazy(() => import('./BlueprintAndEmailView').then((m) => ({ default: m.BlueprintAndEmailView })));

type StaffSection = 'queue' | 'qr' | 'whatsapp' | 'pos' | 'costing';

const SECTIONS: { key: StaffSection; label: string; short: string; icon: React.ReactNode }[] = [
  { key: 'queue', label: 'Kitchen Queue', short: 'Queue', icon: <ClipboardList className="w-5 h-5" /> },
  { key: 'qr', label: 'QR & Setup', short: 'QR', icon: <QrCode className="w-5 h-5" /> },
  { key: 'whatsapp', label: 'WhatsApp', short: 'Chat', icon: <MessageCircle className="w-5 h-5" /> },
  { key: 'pos', label: 'POS & Stock', short: 'POS', icon: <Store className="w-5 h-5" /> },
  { key: 'costing', label: 'Setup & Costing', short: 'Setup', icon: <Wallet className="w-5 h-5" /> },
];

interface StaffDashboardProps {
  orders: QROrder[];
  outlets: RestaurantOutlet[];
  selectedOutletId: string;
  onSelectOutlet: (id: string) => void;
  onOrderCreated: (order: QROrder) => void;
  onUpdateOrder: (id: string, patch: Partial<QROrder>) => void;
  onToggleItemStock: (outletId: string, itemId: string) => void;
  onExit: () => void;
}

function Loading(): React.ReactElement {
  return (
    <div className="p-8 text-center text-sm text-slate-400" role="status">
      Loading…
    </div>
  );
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  orders,
  outlets,
  selectedOutletId,
  onSelectOutlet,
  onOrderCreated,
  onUpdateOrder,
  onToggleItemStock,
  onExit,
}) => {
  const [section, setSection] = useState<StaffSection>('queue');

  const navButton = (key: StaffSection, label: string, icon: React.ReactNode, badge?: number, vertical = false) => (
    <button
      key={key}
      onClick={() => setSection(key)}
      aria-pressed={section === key}
      aria-label={label}
      className={`flex cursor-pointer items-center gap-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
        vertical ? 'w-full px-4 py-3 text-sm' : 'flex-col gap-1 px-2 py-2 min-h-[56px] min-w-[60px] text-[11px]'
      } ${section === key ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      {vertical ? label : <span>{label}</span>}
    </button>
  );

  return (
    <div className="flex gap-4 sm:gap-6 items-start pb-24 md:pb-0">
      {/* Left rail - desktop */}
      <aside aria-label="Staff sections" className="hidden md:flex w-[232px] shrink-0 flex-col gap-1.5 sticky top-24 rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <div className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Staff dashboard
        </div>
        {SECTIONS.map((s) => navButton(s.key, s.label, s.icon, s.key === 'queue' ? orders.length : undefined, true))}
        <div className="mt-2 border-t border-slate-800 pt-2">
          <button
            onClick={onExit}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-all"
          >
            <LogOut className="w-5 h-5" />
            Customer page
          </button>
          <p className="px-2 pt-1 text-[10px] text-slate-500">Staff login arrives next — this screen is open during pilot.</p>
        </div>
      </aside>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={<Loading />}>
          {section === 'queue' && <StaffQueueView orders={orders} onUpdate={onUpdateOrder} />}
          {section === 'qr' && (
            <QROrderView selectedOutletId={selectedOutletId} onSelectOutlet={onSelectOutlet} onOrderCreated={onOrderCreated} />
          )}
          {section === 'whatsapp' && <WhatsAppFlowView />}
          {section === 'pos' && (
            <PetpoojaBridgeView
              outlets={outlets}
              selectedOutletId={selectedOutletId}
              onSelectOutlet={onSelectOutlet}
              onToggleItemStock={onToggleItemStock}
            />
          )}
          {section === 'costing' && <BlueprintAndEmailView />}
        </Suspense>
      </div>

      {/* Bottom bar - mobile */}
      <nav aria-label="Staff sections" className="md:hidden fixed bottom-0 inset-x-0 z-30 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 bg-slate-950/95 backdrop-blur border-t border-slate-800">
        <div className="flex items-stretch justify-around gap-1">
          {SECTIONS.map((s) => navButton(s.key, s.short, s.icon, s.key === 'queue' ? orders.length : undefined))}
        </div>
      </nav>
    </div>
  );
};
