'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Submitted!</h1>
          <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
            Your request has been sent to the family admin for approval. You&apos;ll be able to sign in once approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            Back to Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Join The Stephens<br />Family Hub
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Request access to join the family platform. Once approved by the admin, you&apos;ll get access based on your assigned role.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Sparkles size={22} className="text-white" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Create account</h2>
            <p className="text-text-muted text-sm mt-1">Request access to the family platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/5 border border-danger/15 text-danger text-sm rounded-xl p-3.5 animate-fade-in-up">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Sarah"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Min 8 chars, uppercase + number"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Re-enter your password"
                required
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
                <>
                  Request Access
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-text-muted pt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
