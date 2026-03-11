'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-text-muted mb-6">
          It looks like you&apos;ve lost your internet connection. Check your Wi-Fi or
          mobile data and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
