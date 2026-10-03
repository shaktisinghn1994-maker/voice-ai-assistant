import React from 'react';
import { ZERO_DEGREE_OUTLET } from '../data/zeroDegreeData';

const TAB_CONTEXT: Record<string, string> = {
  customer: 'Students scan, pick items, add Name + Block — order lands on the kitchen screen.',
  staff: 'Staff dashboard: live queue, QR setup, WhatsApp, POS stock and costing. Login arrives next.',
};

interface SiteFooterProps {
  tabs: [string, string][];
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ tabs, activeTab, onNavigate }) => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-8 pb-5">
        {TAB_CONTEXT[activeTab] && (
          <p className="text-xs text-slate-400 border-l-2 border-amber-500 pl-3 mb-6 max-w-2xl" aria-live="polite">
            {TAB_CONTEXT[activeTab]}
          </p>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-bold text-slate-100">Parallel Eats</div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              QR + WhatsApp ordering for hostel restaurants and vendor supply. One queue for staff, zero app downloads for customers.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilot outlet</div>
            <div className="text-slate-100 font-semibold mt-1.5">{ZERO_DEGREE_OUTLET.name}</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ZERO_DEGREE_OUTLET.address}</p>
            <p className="text-xs text-slate-300 font-mono mt-1">{ZERO_DEGREE_OUTLET.phone}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ZERO_DEGREE_OUTLET.hours}</p>
          </div>
          <nav aria-label="Footer sections">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Explore</div>
            <ul className="mt-1.5 space-y-1">
              {tabs.map(([key, label]) => (
                <li key={key}>
                  <button
                    onClick={() => onNavigate(key)}
                    aria-current={activeTab === key ? 'page' : undefined}
                    className={`text-xs cursor-pointer ${activeTab === key ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-slate-100'}`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Good to know</div>
            <ul className="mt-1.5 space-y-1.5 text-xs text-slate-400 leading-relaxed">
              <li>Order completes only with Name + Block.</li>
              <li>Pay cash, UPI or card outside the app — staff ticks it.</li>
              <li>Closed hours block new orders; in-progress orders finish.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© {year} Parallel Eats • A Bharat Parallel product</span>
          <span className="font-mono">Pilot v1 — hostel mode • Name + Block required</span>
        </div>
      </div>
    </footer>
  );
};
