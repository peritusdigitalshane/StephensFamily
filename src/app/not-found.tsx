import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-text-muted text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Home size={14} /> Dashboard
          </Link>
          <Link
            href="/"
            className="border border-border px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-surface transition-colors"
          >
            <ArrowLeft size={14} /> Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}
