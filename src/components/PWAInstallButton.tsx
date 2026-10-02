import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <>
      {!isInstalled && (
        <button
          onClick={async () => {
            if (isInstallable) {
              await install();
            } else {
              setShowGuideModal(true);
            }
          }}
          className="hidden sm:flex px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
        </button>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100">
                Install Parallel Eats
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="font-semibold text-amber-400">
                  Install as a Desktop / Mobile App (PWA)
                </div>
                {isIOS ? (
                  <p>
                    Open this app URL in <strong>Safari</strong>, tap the <strong>Share</strong> icon, and tap <strong>Add to Home Screen</strong>.
                  </p>
                ) : (
                  <p>
                    Open your live app URL in a new Chrome tab and click the <strong>Install Parallel Eats</strong> icon in the address bar (or browser menu ⋮ → <strong>Install App</strong>).
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
