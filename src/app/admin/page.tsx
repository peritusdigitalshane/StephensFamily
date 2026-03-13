'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Check, X, Trash2, UserCog, Users } from 'lucide-react';
import { ASSIGNABLE_ROLES, ROLES } from '@/lib/roles';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  color: string;
  avatar: string;
  createdAt: string;
}

const MEMBER_COLORS = [
  '#2563eb', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#6366f1',
];

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role !== 'superadmin') {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [session, router, fetchUsers]);

  const updateUser = async (userId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });
      if (res.ok) {
        fetchUsers();
        if (data.role) {
          toast(`Role updated to "${data.role}"`, 'success');
        }
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast('Failed to update user', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchUsers();
        toast('User removed', 'success');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast('Failed to remove user', 'error');
    }
  };

  const approveUser = async (userId: string, role: string) => {
    await updateUser(userId, { approved: true, role });
    toast(`User approved as "${role}"`, 'success');
    setEditingUser(null);
  };

  const pendingUsers = users.filter((u) => !u.approved);
  const approvedUsers = users.filter((u) => u.approved);

  const getRoleLabel = (role: string) =>
    ROLES.find((r) => r.value === role)?.label || role;

  if (session?.user?.role !== 'superadmin') return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield size={24} className="text-primary" />
          Admin Panel
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Manage family members, approve registrations, and assign roles
        </p>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UserCog size={18} className="text-accent" />
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-accent/5 border border-accent/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Assign role:</span>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <button
                            key={role.value}
                            onClick={() => approveUser(user.id, role.value)}
                            className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors"
                          >
                            {role.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-1.5 text-text-muted hover:bg-surface rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="bg-success text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-success/80"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user.id)}
                          className="bg-danger text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-danger/80"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Members */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users size={18} className="text-primary" />
          Family Members ({approvedUsers.length})
        </h2>

        {loading ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <p className="text-text-muted">Loading users...</p>
          </div>
        ) : approvedUsers.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <p className="text-text-muted">No approved members yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                      style={{
                        backgroundColor: user.role === 'superadmin' ? '#2563eb15' : '#64748b15',
                        color: user.role === 'superadmin' ? '#2563eb' : '#64748b',
                      }}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  {user.role !== 'superadmin' && (
                    <div className="flex items-center gap-2">
                      {/* Role selector */}
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value })}
                        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      {/* Color picker */}
                      <div className="flex gap-1">
                        {MEMBER_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateUser(user.id, { color })}
                            className="w-5 h-5 rounded-full border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: user.color === color ? '#1a1a2e' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setDeleteTarget(user.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded"
                        title="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteUser(deleteTarget); }}
        title="Remove User"
        message="Are you sure you want to remove this user? This action cannot be undone."
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      {/* Role Permissions Reference */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-surface-hover border-b border-border">
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-center px-2 py-2 font-medium">Calendar</th>
                <th className="text-center px-2 py-2 font-medium">Tasks</th>
                <th className="text-center px-2 py-2 font-medium">Shopping</th>
                <th className="text-center px-2 py-2 font-medium">Meals</th>
                <th className="text-center px-2 py-2 font-medium">Bulletin</th>
                <th className="text-center px-2 py-2 font-medium">Chat</th>
                <th className="text-center px-2 py-2 font-medium">Agents</th>
                <th className="text-center px-2 py-2 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'Super Admin', perms: ['Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full'] },
                { role: 'Parent', perms: ['Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', '-'] },
                { role: 'Child', perms: ['Own', 'Own', 'Own', 'View', 'Own', 'Full', 'Own', '-'] },
                { role: 'Auntie/Uncle', perms: ['View', 'View', 'View', 'View', 'Own', 'Full', 'Own', '-'] },
                { role: 'Nan/Pop', perms: ['View', 'View', 'View', 'View', 'Own', 'Full', 'Own', '-'] },
                { role: 'Cousin', perms: ['View', 'View', 'View', 'View', 'Own', 'Full', 'Own', '-'] },
              ].map((row) => (
                <tr key={row.role} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{row.role}</td>
                  {row.perms.map((perm, i) => (
                    <td key={i} className="text-center px-2 py-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          perm === 'Full'
                            ? 'bg-success/10 text-success'
                            : perm === 'Own'
                            ? 'bg-accent/10 text-accent'
                            : perm === 'View'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-hover text-text-muted'
                        }`}
                      >
                        {perm}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted mt-2">
          <strong>Full</strong> = Create, edit, delete everything &middot;{' '}
          <strong>Own</strong> = Create own items, edit own items, view all &middot;{' '}
          <strong>View</strong> = Read-only access &middot;{' '}
          <strong>-</strong> = No access
        </p>
      </div>
    </div>
  );
}
