/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { RESTAURANT_OUTLETS } from './data/cafeData';
import { QROrder, RestaurantOutlet } from './types';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SiteFooter } from './components/SiteFooter';
import { StaffDashboard } from './components/StaffDashboard';
import { StaffLogin } from './components/StaffLogin';
import { loadOrders, saveOrders } from './utils/orderStore';
import { clearSession, getSession } from './utils/staffSession';
import { useTheme } from './hooks/useTheme';

import { ZeroDegreeCustomerView } from './components/ZeroDegreeCustomerView';

type AppView = 'customer' | 'staff-login' | 'staff';

const FOOTER_TABS: [string, string][] = [
  ['customer', 'Customer Page'],
  ['staff', 'Staff Dashboard'],
];

export default function App() {
  const [view, setView] = useState<AppView>('customer');
  const [staffCafe, setStaffCafe] = useState<string>('');
  const [outletOpen, setOutletOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pe-outlet-open:v1') !== 'closed';
    } catch {
      return true;
    }
  });
  const [outlets, setOutlets] = useState<RestaurantOutlet[]>(RESTAURANT_OUTLETS);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(RESTAURANT_OUTLETS[0].id);
  const [orders, setOrders] = useState<QROrder[]>(loadOrders);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const openStaff = () => {
    const session = getSession();
    if (session) {
      setStaffCafe(session.cafeName);
      setView('staff');
    } else {
      setView('staff-login');
    }
  };

  const handleLogin = (_outletId: string, cafeName: string) => {
    setStaffCafe(cafeName);
    setView('staff');
  };

  const handleLogout = () => {
    clearSession();
    setStaffCafe('');
    setView('customer');
  };

  const toggleOutletOpen = () => {
    setOutletOpen((open) => {
      try {
        localStorage.setItem('pe-outlet-open:v1', open ? 'closed' : 'open');
      } catch {
        // ignore
      }
      return !open;
    });
  };

  const handleOrderCreated = (o: QROrder) => {
    setOrders((prev) => [o, ...prev]);
    showToast(`Order ${o.orderId} saved — staff will confirm on WhatsApp.`);
  };

  const handleUpdateOrder = (id: string, patch: Partial<QROrder>) => {
    setOrders((prev) => prev.map((o) => (o.orderId === id ? { ...o, ...patch } : o)));
  };

  const handleToggleItemStock = (outletId: string, itemId: string) => {
    setOrders((prev) => prev);
    setOutlets((prev) =>
      prev.map((outlet) => {
        if (outlet.id !== outletId) return outlet;
        return {
          ...outlet,
          menu: outlet.menu.map((item) =>
            item.item_id !== itemId ? item : { ...item, inStock: !item.inStock }
          ),
        };
      })
    );
    showToast('Stock toggled. QR + WhatsApp block out-of-stock instantly.');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:rounded-lg focus:text-sm focus:font-bold">
        Skip to main content
      </a>
      <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/90 bg-slate-950/90 sticky top-0 z-30">
        <span className="text-lg font-bold tracking-tight">Parallel Eats</span>
        <nav aria-label="App views" className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setView('customer')}
            aria-pressed={view === 'customer'}
            className={`px-3 sm:px-4 py-2 min-h-[40px] rounded-lg cursor-pointer transition-colors ${view === 'customer' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Order
          </button>
          <button
            onClick={openStaff}
            aria-pressed={view === 'staff' || view === 'staff-login'}
            className={`px-3 sm:px-4 py-2 min-h-[40px] rounded-lg cursor-pointer transition-colors ${view === 'staff' || view === 'staff-login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Staff{orders.length > 0 ? ` (${orders.length})` : ''}
          </button>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton />
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] px-2.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-500" />}
          </button>
        </div>
      </header>

      {toast && (
        <div className="max-w-[1400px] w-full mx-auto px-6 pt-4" role="status" aria-live="polite">
          <div className="bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between">
            <span>{toast}</span>
            <button onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-4 cursor-pointer">Close</button>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {view === 'customer' && (
          <>
            <div className="text-xs font-mono text-slate-500">
              Zero Degree theme: black board + orange ribbon + brush headers like your menu. Pilot: Pizza + Cold Coffee + Fries. This page is what the QR/WhatsApp link opens.
            </div>
            <div className="-mx-6 -my-8">
              <ZeroDegreeCustomerView
                isOpen={outletOpen}
                onOrderPlaced={(_s, orderObj) => {
                  if (orderObj) {
                    handleOrderCreated(orderObj);
                  }
                }}
                onSwitchToStaff={openStaff}
              />
            </div>
          </>
        )}
        {view === 'staff-login' && (
          <StaffLogin onLogin={handleLogin} onBack={() => setView('customer')} />
        )}
        {view === 'staff' && (
          <StaffDashboard
            orders={orders}
            outlets={outlets}
            selectedOutletId={selectedOutletId}
            cafeName={staffCafe}
            onSelectOutlet={setSelectedOutletId}
            onOrderCreated={handleOrderCreated}
            onUpdateOrder={handleUpdateOrder}
            onToggleItemStock={handleToggleItemStock}
            onExit={() => setView('customer')}
            onLogout={handleLogout}
            isOpen={outletOpen}
            onToggleOpen={toggleOutletOpen}
          />
        )}
      </main>

      <SiteFooter
        tabs={FOOTER_TABS}
        activeTab={view === 'customer' ? 'customer' : 'staff'}
        onNavigate={(t) => (t === 'staff' ? openStaff() : setView('customer'))}
      />
    </div>
  );
}
