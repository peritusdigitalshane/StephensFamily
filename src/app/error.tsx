'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
          <AlertTriangle size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-text-muted text-sm mb-6">
          An unexpected error occurred. Don&apos;t worry, your data is safe.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <RotateCcw size={14} /> Try Again
          </button>
          <Link
            href="/"
            className="border border-border px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-surface transition-colors"
          >
            <Home size={14} /> Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-text-muted mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
