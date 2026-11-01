import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const NetworkBanner: React.FC = () => {
  const { isOnline, toggleSimulateOffline, t } = useApp();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [prevOnlineStatus, setPrevOnlineStatus] = useState(isOnline);

  useEffect(() => {
    if (!prevOnlineStatus && isOnline) {
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    setPrevOnlineStatus(isOnline);
  }, [isOnline, prevOnlineStatus]);

  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white px-3 py-2 text-xs transition-all shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-rose-200" />
            <div>
              <p className="font-bold">{t('offlineBannerTitle')}</p>
              <p className="text-[11px] text-rose-100 opacity-90">
                {t('offlineBannerDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSimulateOffline}
            className="px-2.5 py-1 bg-white text-rose-700 hover:bg-rose-50 text-[11px] font-bold rounded shadow-xs shrink-0 active:scale-95 transition-all"
          >
            {t('reconnectBtn')}
          </button>
        </div>
      </div>
    );
  }

  if (showReconnectedToast) {
    return (
      <div className="bg-emerald-600 text-white px-3 py-2 text-xs transition-all shadow-md animate-fadeIn">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <p className="font-semibold">
              {t('reconnected')}
            </p>
          </div>
          <button
            onClick={() => setShowReconnectedToast(false)}
            className="text-emerald-200 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
};
