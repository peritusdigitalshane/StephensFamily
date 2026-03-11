'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Lock, Palette, Save, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

const MEMBER_COLORS = [
  '#2563eb', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#6366f1',
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [color, setColor] = useState(session?.user?.color || '#6366f1');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const user = session?.user;
  if (!user) return null;

  const handleUpdateProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated! Sign out and back in to see changes.' });
        await update();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ backgroundColor: color }}
          >
            {user.avatar || user.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-white/60 text-sm">{user.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-semibold text-base flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          Profile Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5 flex items-center gap-1.5">
              <Palette size={12} /> Profile Colour
            </label>
            <div className="flex gap-2">
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#0f172a' : 'transparent',
                  }}
                  aria-label={`Select colour ${c}`}
                />
              ))}
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleUpdateProfile}
            disabled={saving || !name.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-semibold text-base flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Lock size={14} className="text-white" />
          </div>
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted block mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted block mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {passwordMessage && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${passwordMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {passwordMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {passwordMessage.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 transition-all"
          >
            <Lock size={14} /> Change Password
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Sign Out</h3>
            <p className="text-xs text-text-muted mt-0.5">Sign out of your account on this device</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="border border-danger/30 text-danger px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-danger/5 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
