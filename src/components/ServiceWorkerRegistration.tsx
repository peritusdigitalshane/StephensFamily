'use client';

import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates periodically (every 60 minutes)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });
      })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });

    // Reload when the new service worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    waitingWorker?.postMessage('SKIP_WAITING');
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
      <div className="bg-surface border border-border rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Update Available</p>
          <p className="text-xs text-text-muted">A new version is ready to install.</p>
        </div>
        <button
          onClick={handleUpdate}
          className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
        >
          Update
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-text-muted hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
