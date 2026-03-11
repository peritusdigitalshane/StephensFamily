'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    setIsStandalone(!!standalone);

    if (standalone) return;

    // Check if dismissed recently (don't nag more than once per week)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // On iOS, show manual install instructions after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge/Samsung: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
      <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-purple-500 px-4 py-3 flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Install Stephens Hub</span>
          <button
            onClick={handleDismiss}
            className="ml-auto text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          {isIOS ? (
            <div className="text-sm text-text-muted space-y-2">
              <p>Install this app on your iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Tap the <strong>Share</strong> button <span className="inline-block w-4 h-4 align-middle">&#x2191;</span> in Safari
                </li>
                <li>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                </li>
                <li>
                  Tap <strong>&quot;Add&quot;</strong> to confirm
                </li>
              </ol>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-text-muted flex-1">
                Add to your home screen for quick access, even offline.
              </p>
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
