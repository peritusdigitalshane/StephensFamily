'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const passwordValid = hasMinLength && hasUppercase && hasNumber;

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token && !verifying) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <XCircle size={24} className="text-danger" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Reset Token</h2>
        <p className="text-text-muted text-sm mb-6">
          No reset token was provided. Please use the link from your password reset email.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          Request New Reset Link
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Verifying token
  if (verifying) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Reset Link</h2>
        <p className="text-text-muted text-sm">Checking your reset link...</p>
      </div>
    );
  }

  // Invalid or expired token
  if (!tokenValid && !verifying) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Invalid or Expired Link</h2>
        <p className="text-text-muted text-sm mb-6">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          Request New Reset Link
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={24} className="text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Successfully!</h2>
        <p className="text-text-muted text-sm mb-6">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          Sign In
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Password reset form
  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-xl flex items-center justify-center mb-4">
          <Lock size={22} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
        <p className="text-text-muted text-sm mt-1">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/5 border border-danger/15 text-danger text-sm rounded-xl p-3.5 animate-fade-in-up">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Enter new password"
            required
            autoFocus
          />
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-success' : 'text-text-muted'}`}>
                {hasMinLength ? <CheckCircle size={12} /> : <XCircle size={12} />}
                Min 8 characters
              </div>
              <div className={`flex items-center gap-2 text-xs ${hasUppercase ? 'text-success' : 'text-text-muted'}`}>
                {hasUppercase ? <CheckCircle size={12} /> : <XCircle size={12} />}
                One uppercase letter
              </div>
              <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-success' : 'text-text-muted'}`}>
                {hasNumber ? <CheckCircle size={12} /> : <XCircle size={12} />}
                One number
              </div>
            </div>
          )}
          {password.length === 0 && (
            <p className="text-xs text-text-muted mt-1.5">Min 8 characters, one uppercase, one number</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Confirm new password"
            required
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-danger mt-1.5 flex items-center gap-1">
              <XCircle size={12} />
              Passwords do not match
            </p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-success mt-1.5 flex items-center gap-1">
              <CheckCircle size={12} />
              Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordValid || !passwordsMatch}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Reset Password
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-sm text-text-muted pt-2">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
            <Sparkles size={28} className="text-white" />
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

          <Suspense
            fallback={
              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Loading</h2>
                <p className="text-text-muted text-sm">Please wait...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
