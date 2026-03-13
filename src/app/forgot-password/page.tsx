'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silently handle - show success regardless
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/5 rounded-full" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            The Stephens<br />Family Hub
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Your family&apos;s command centre. AI chat, calendars, tasks, meals, and everything your family needs in one beautiful place.
          </p>
          <div className="mt-10 space-y-4">
            {['AI-powered family assistant', 'Shared calendar & scheduling', 'Tasks, shopping & meal planning'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Sparkles size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">The Stephens Family Hub</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
            <p className="text-text-muted text-sm mt-1">Enter your email to receive a reset link</p>
          </div>

          {submitted ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-success/5 border border-success/15 text-success text-sm rounded-xl p-4 leading-relaxed">
                If an account exists with that email, a reset link has been created. Please contact your family admin to get the link.
              </div>

              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <p className="text-center text-sm text-text-muted pt-2">
                <Link href="/login" className="text-primary hover:underline font-semibold inline-flex items-center gap-1.5">
                  <ArrowLeft size={14} />
                  Back to Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
