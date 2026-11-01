import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ArrowDownToLine, 
  ExternalLink,
  ShieldCheck,
  Chrome,
  Share2,
  Copy,
  Apple,
  Sparkles,
  Wifi,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PwaInstall } from '../../services/pwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { t } = useApp();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'apk' | 'playstore'>('android');

  if (!isOpen) return null;

  const appShareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Konekta - FB Lite Social App',
          text: 'Sumali sa Konekta! Mag-post, mag-message, at mag-browse nang mabilis at matipid sa data.',
          url: appShareUrl,
        });
      } catch (err) {
        // User cancelled or share not supported
      }
    } else {
      handleCopyLink();
    }
  };

  // Real install (PWA / WebAPK) instead of downloading a fake .apk file
  const handleDownloadApk = async () => {
    if (!PwaInstall.canPrompt()) {
      setActiveGuideTab('android');
      return;
    }
    setDownloadProgress(50);
    setIsDone(false);
    const ok = await PwaInstall.prompt();
    if (ok) {
      setDownloadProgress(100);
      setIsDone(true);
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
    } else {
      setDownloadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scaleUp text-gray-800 dark:text-gray-100 max-h-[92vh] flex flex-col"
        role="dialog"
      >
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                <span>{t('installApp')}</span>
                <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-mono">v1.0</span>
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Konekta Mobile (PWA & APK Installer)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Share Section with Link & Copy Button */}
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Ibahagi sa Ibang Users / Kaibigan
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Live & Active
              </span>
            </div>

            <p className="text-[11px] text-gray-600 dark:text-gray-300">
              I-send ang link na ito sa Messenger, SMS, o i-post para mabuksan at ma-download ng kahit sino sa kanilang cellphone:
            </p>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate flex-1 select-all">
                {appShareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Nakopya!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopyahin</span>
                  </>
                )}
              </button>
            </div>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                I-share gamit ang Messenger / Apps
              </button>
            )}
          </div>

          {/* Tab Selector: Android, iOS, Direct APK, Play Store */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setActiveGuideTab('android')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeGuideTab === 'android'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Chrome className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('ios')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeGuideTab === 'ios'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('playstore')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeGuideTab === 'playstore'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
              <span>Play Store</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('apk')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeGuideTab === 'apk'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>APK File</span>
            </button>
          </div>

          {/* Guide Tab Contents */}
          {activeGuideTab === 'android' && (
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Chrome className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                    Paano i-install sa Android (Chrome / Brave / Samsung)
                  </h4>
                  <p className="text-[11px] text-gray-500">Diretsong magiging App Icon sa Home Screen</p>
                </div>
              </div>

              <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2 pl-4 list-decimal">
                <li>
                  I-tap ang <strong>tatlong tuldok (⋮)</strong> sa kanang itaas ng Google Chrome.
                </li>
                <li>
                  Hanapin at pindutin ang <strong>"Add to Home screen"</strong> o <strong>"I-install ang app"</strong> (Install App).
                </li>
                <li>
                  Pindutin ang <strong>"Install"</strong> sa lalabas na confirmation prompt.
                </li>
                <li>
                  Tapos na! May <strong>Konekta icon</strong> na sa cellphone na bubukas tulad ng Facebook Lite nang walang URL bar.
                </li>
              </ol>
            </div>
          )}

          {activeGuideTab === 'ios' && (
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-500/10 text-gray-800 dark:text-gray-200 flex items-center justify-center">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                    Paano i-install sa iPhone / iPad (Safari)
                  </h4>
                  <p className="text-[11px] text-gray-500">Mabilisang install para sa iOS</p>
                </div>
              </div>

              <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2 pl-4 list-decimal">
                <li>
                  Buksan ang link sa <strong>Safari browser</strong> sa iPhone.
                </li>
                <li>
                  Pindutin ang <strong>Share button</strong> sa ibaba (kahon na may arrow pataas: ⎋).
                </li>
                <li>
                  Mag-scroll pababa at piliin ang <strong>"Add to Home Screen"</strong> (Idagdag sa Home Screen).
                </li>
                <li>
                  Pindutin ang <strong>"Add"</strong> sa kanang itaas. Agad itong lilitaw sa home screen bilang app.
                </li>
              </ol>
            </div>
          )}

          {activeGuideTab === 'playstore' && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                    Paano i-publish sa Google Play Store
                  </h4>
                  <p className="text-[11px] text-gray-500">Mabilisang proseso (PWA to Play Store .AAB)</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Gamitin ang PWABuilder (Libre at Opisyal ng Google)
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Pumunta sa <strong>pwabuilder.com</strong> at ilagay ang Live Link ng Konekta. I-click ang <strong>"Package for Android"</strong> para makuha ang iyong nilagdaang <code>.aab</code> (Android App Bundle).
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Google Play Console Account
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Mag-login sa <strong>play.google.com/console</strong> gamit ang iyong Google account (may $25 one-time fee sa Google para maging developer).
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    Store Listing at App Assets
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    I-fill-up ang App Name (Konekta), maikling paglalarawan, App Icon (512x512), Feature Graphic (1024x500), at mga screenshots.
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                    I-upload ang .AAB at I-publish
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    I-upload ang <code>.aab</code> bundle file sa Production track at i-click ang <strong>"Send for Review"</strong>. Karaniwang naaprubahan ng Google sa loob ng 1 hanggang 3 araw!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'apk' && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-center space-y-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl mx-auto flex items-center justify-center shadow-md">
                <ArrowDownToLine className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                  Direktang I-download ang APK File
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Direktang i-install sa phone mo (walang APK file)
                </p>
              </div>

              {downloadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    <span>{isDone ? t('downloadComplete') : t('downloading')}</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleDownloadApk}
                disabled={downloadProgress !== null && !isDone}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isDone ? 'I-download Muli (.apk)' : t('downloadApk')}</span>
              </button>
            </div>
          )}

          {/* Benefits summary */}
          <div className="grid grid-cols-2 gap-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 justify-center">
              <Wifi className="w-3.5 h-3.5 text-blue-500" />
              <span>Matipid sa Data (Lite)</span>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Walang Virus / Ligtas</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
          >
            Isara (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
