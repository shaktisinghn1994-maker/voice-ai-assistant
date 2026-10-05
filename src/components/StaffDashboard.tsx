import React, { Suspense, lazy, useState } from 'react';
import { ClipboardList, QrCode, MessageCircle, Store, Wallet, KeyRound, LogOut } from 'lucide-react';
import { QROrder, RestaurantOutlet } from '../types';
import { StaffAccess } from './StaffAccess';

// Code-split like App: staff sections load on demand, never in the customer bundle.
const QROrderView = lazy(() => import('./QROrderView').then((m) => ({ default: m.QROrderView })));
const StaffQueueView = lazy(() => import('./StaffQueueView').then((m) => ({ default: m.StaffQueueView })));
const WhatsAppFlowView = lazy(() => import('./WhatsAppFlowView').then((m) => ({ default: m.WhatsAppFlowView })));
const PetpoojaBridgeView = lazy(() => import('./PetpoojaBridgeView').then((m) => ({ default: m.PetpoojaBridgeView })));
const BlueprintAndEmailView = lazy(() => import('./BlueprintAndEmailView').then((m) => ({ default: m.BlueprintAndEmailView })));

type StaffSection = 'queue' | 'qr' | 'whatsapp' | 'pos' | 'costing' | 'access';

const SECTIONS: { key: StaffSection; label: string; short: string; icon: React.ReactNode }[] = [
  { key: 'queue', label: 'Kitchen Queue', short: 'Queue', icon: <ClipboardList className="w-5 h-5" /> },
  { key: 'qr', label: 'QR & Setup', short: 'QR', icon: <QrCode className="w-5 h-5" /> },
  { key: 'whatsapp', label: 'WhatsApp', short: 'Chat', icon: <MessageCircle className="w-5 h-5" /> },
  { key: 'pos', label: 'POS & Stock', short: 'POS', icon: <Store className="w-5 h-5" /> },
  { key: 'costing', label: 'Setup & Costing', short: 'Setup', icon: <Wallet className="w-5 h-5" /> },
  { key: 'access', label: 'PIN & Access', short: 'PIN', icon: <KeyRound className="w-5 h-5" /> },
];

interface StaffDashboardProps {
  orders: QROrder[];
  outlets: RestaurantOutlet[];
  selectedOutletId: string;
  cafeName: string;
  onSelectOutlet: (id: string) => void;
  onOrderCreated: (order: QROrder) => void;
  onUpdateOrder: (id: string, patch: Partial<QROrder>) => void;
  onToggleItemStock: (outletId: string, itemId: string) => void;
  onExit: () => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
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
  cafeName,
  onSelectOutlet,
  onOrderCreated,
  onUpdateOrder,
  onToggleItemStock,
  onExit,
  onLogout,
  isOpen,
  onToggleOpen,
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
        <div className="px-2 pt-1 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Staff dashboard</div>
          <div className="text-xs font-semibold text-slate-300 truncate">{cafeName}</div>
        </div>
        {SECTIONS.map((s) => navButton(s.key, s.label, s.icon, s.key === 'queue' ? orders.length : undefined, true))}
        <button
          onClick={onToggleOpen}
          aria-pressed={isOpen}
          aria-label={isOpen ? 'Mark outlet closed' : 'Mark outlet open'}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer transition-all"
          style={{ background: isOpen ? '#16a34a' : '#ef4444', color: '#fff' }}
        >
          <span aria-hidden="true">{isOpen ? '●' : '○'}</span>
          {isOpen ? 'OPEN — tap to close' : 'CLOSED — tap to open'}
        </button>
        <div className="mt-2 border-t border-slate-800 pt-2 space-y-1">
          <button
            onClick={onExit}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-all"
          >
            <LogOut className="w-5 h-5" />
            Customer page
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-950/40 cursor-pointer transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between gap-2 mb-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
          <span className="text-xs font-semibold text-slate-300 truncate">{cafeName}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleOpen}
              aria-pressed={isOpen}
              aria-label={isOpen ? 'Mark outlet closed' : 'Mark outlet open'}
              className="min-h-[40px] px-3 rounded-lg text-xs font-bold cursor-pointer"
              style={{ background: isOpen ? '#16a34a' : '#ef4444', color: '#fff' }}
            >
              {isOpen ? '● OPEN' : 'CLOSED'}
            </button>
            <button
              onClick={onLogout}
              aria-label="Log out of staff dashboard"
              className="min-h-[40px] px-3 rounded-lg text-xs font-semibold text-rose-300 bg-slate-800 cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
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
          {section === 'access' && <StaffAccess />}
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
