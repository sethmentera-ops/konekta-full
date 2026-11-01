import React, { useEffect, useState } from 'react';
import { PwaInstall } from '../../services/pwaInstall';

// Shown on every visit from a phone browser until the app is installed.
// If the user taps "Mamaya na", it comes back after RESHOW_MS (unlimited).
const RESHOW_MS = 15 * 1000;

export const InstallPrompt: React.FC = () => {
  const [, force] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const eligible = () => PwaInstall.isMobile() && !PwaInstall.isInstalled();

  useEffect(() => PwaInstall.subscribe(() => force((n) => n + 1)), []);

  useEffect(() => {
    if (eligible()) setVisible(true);
  }, []);

  useEffect(() => {
    if (visible || !eligible()) return;
    const id = setTimeout(() => setVisible(true), RESHOW_MS);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible || !eligible()) return null;

    const onInstall = async () => {
    if (showSteps) {
      later();
      return;
    }
    if (PwaInstall.canPrompt()) {
      const ok = await PwaInstall.prompt();
      if (ok) setVisible(false);
    } else {
      setShowSteps(true);
    }
  };

  const later = () => {
    setShowSteps(false);
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-6 shadow-2xl text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="Konekta" className="w-14 h-14 rounded-2xl shadow" />
          <div>
            <h2 className="text-lg font-extrabold leading-tight">I-install ang Konekta</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mabilis, magaan, at matipid sa data</p>
          </div>
        </div>

        {showSteps ? (
          <ol className="mt-4 text-sm space-y-2 list-decimal list-inside text-gray-700 dark:text-gray-200">
            {PwaInstall.isIOS() ? (
              <>
                <li>Pindutin ang <b>Share</b> button sa Safari.</li>
                <li>Piliin ang <b>Add to Home Screen</b>.</li>
                <li>Pindutin ang <b>Add</b>.</li>
              </>
            ) : (
              <>
                <li>Pindutin ang <b>⋮</b> (tatlong tuldok) sa taas ng Chrome.</li>
                <li>Piliin ang <b>Install app</b> o <b>Add to Home screen</b>.</li>
                <li>Pindutin ang <b>Install</b>.</li>
              </>
            )}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            I-install ang app para mas mabilis buksan, may icon sa home screen, at gagana tulad ng Facebook Lite.
          </p>
        )}

        <button
          onClick={onInstall}
          className="mt-4 w-full py-3 bg-blue-600 active:bg-blue-700 text-white text-sm font-bold rounded-xl"
        >
          {showSteps ? 'Sige, na-gets ko' : 'I-install ang App'}
        </button>
        <button
          onClick={later}
          className="mt-2 w-full py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
        >
          Mamaya na
        </button>
      </div>
    </div>
  );
};
