// Captures Chrome's "beforeinstallprompt" as early as possible (imported from main.tsx)
// so the app can show its own "Install app" popup.

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BIPEvent | null = null;
let installedThisSession = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installedThisSession = true;
    deferred = null;
    notify();
  });
}

export const PwaInstall = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  /** true when running as the installed app (no browser UI) */
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  },
  isInstalled(): boolean {
    return installedThisSession || this.isStandalone();
  },
  isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  },
  isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  },
  canPrompt(): boolean {
    return !!deferred;
  },
  /** Opens the native install dialog. Returns true if the user accepted. */
  async prompt(): Promise<boolean> {
    if (!deferred) return false;
    const ev = deferred;
    deferred = null; // a prompt event can only be used once
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    notify();
    return outcome === 'accepted';
  },
};
