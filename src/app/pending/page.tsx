'use client';

import { signOut } from 'next-auth/react';
import { Clock } from 'lucide-react';

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Awaiting Approval</h1>
        <p className="text-text-muted text-sm mb-6">
          Your account has been created but is waiting for the family admin to approve it and assign you a role.
          Check back soon!
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="inline-block bg-surface border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-hover"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
