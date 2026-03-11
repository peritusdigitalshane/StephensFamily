'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Pencil,
  Filter,
  Check,
  RotateCcw,
  CalendarDays,
  Loader2,
  ListChecks,
  ClipboardList,
  X,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate?: string;
  completed: boolean;
  category: 'chore' | 'errand' | 'homework' | 'other';
  recurring: 'daily' | 'weekly' | 'monthly' | 'none' | null;
  createdBy: string;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar?: string;
}

const taskCategories: Task['category'][] = ['chore', 'errand', 'homework', 'other'];
const recurringOptions: { value: string; label: string }[] = [
  { value: 'none', label: 'One-off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  chore: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  errand: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  homework: { bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  other: { bg: 'bg-slate-500/10', text: 'text-slate-600', dot: 'bg-slate-500' },
};

const emptyForm = {
  title: '',
  assignedTo: '',
  dueDate: '',
  category: 'chore' as Task['category'],
  recurring: 'none',
};

export default function TasksPage() {
  const { data: session } = useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterMember, setFilterMember] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{ id: string } & typeof emptyForm>({ id: '', ...emptyForm });

  // ── Data fetching ──────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch members', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchMembers()]).finally(() => setLoading(false));
  }, [fetchTasks, fetchMembers]);

  // ── Mutations ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          assignedTo: createForm.assignedTo || (members[0]?.id ?? ''),
          dueDate: createForm.dueDate || undefined,
          category: createForm.category,
          recurring: createForm.recurring === 'none' ? null : createForm.recurring,
        }),
      });
      await fetchTasks();
      setCreateForm({ ...emptyForm, assignedTo: members[0]?.id ?? '' });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editForm.id,
          title: editForm.title.trim(),
          assignedTo: editForm.assignedTo,
          dueDate: editForm.dueDate || undefined,
          category: editForm.category,
          recurring: editForm.recurring === 'none' ? null : editForm.recurring,
        }),
      });
      await fetchTasks();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const openEditModal = (task: Task) => {
    setEditForm({
      id: task.id,
      title: task.title,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate ?? '',
      category: task.category,
      recurring: task.recurring ?? 'none',
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setCreateForm({ ...emptyForm, assignedTo: members[0]?.id ?? '' });
    setShowCreateModal(true);
  };

  // ── Helpers ────────────────────────────────────────────────────

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getMemberName = (id: string) => getMember(id)?.name || id;
  const getMemberColor = (id: string) => getMember(id)?.color || '#64748b';

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return 'Today';
      if (isTomorrow(d)) return 'Tomorrow';
      return format(d, 'd MMM');
    } catch {
      return dateStr;
    }
  };

  const isDueDateOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      return isPast(d) && !isToday(d);
    } catch {
      return false;
    }
  };

  // ── Filtered / derived data ────────────────────────────────────

  const filteredTasks = tasks
    .filter((t) => filterMember === 'all' || t.assignedTo === filterMember)
    .filter((t) => showCompleted || !t.completed);

  const pendingTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);
  const totalPending = tasks.filter((t) => !t.completed).length;
  const totalCompleted = tasks.filter((t) => t.completed).length;

  // ── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                Tasks &amp; Chores
              </h1>
              <p className="text-white/70 text-sm mt-2">
                Keep the family on track with tasks, chores, and to-dos.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ClipboardList size={14} />
              </div>
              <div>
                <p className="text-lg font-bold">{totalPending}</p>
                <p className="text-[11px] text-white/60">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ListChecks size={14} />
              </div>
              <div>
                <p className="text-lg font-bold">{totalCompleted}</p>
                <p className="text-[11px] text-white/60">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckSquare size={14} />
              </div>
              <div>
                <p className="text-lg font-bold">{tasks.length}</p>
                <p className="text-[11px] text-white/60">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-text-muted">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wide">Filters</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        >
          <option value="all">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`text-sm px-4 py-2 rounded-xl border transition-all font-medium ${
            showCompleted
              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 shadow-sm'
              : 'border-border bg-background text-text-muted hover:border-indigo-500/20'
          }`}
        >
          {showCompleted ? 'Showing completed' : 'Show completed'}
        </button>
        {filterMember !== 'all' && (
          <button
            onClick={() => setFilterMember('all')}
            className="text-xs text-text-muted hover:text-foreground flex items-center gap-1 ml-auto"
          >
            <X size={12} /> Clear filter
          </button>
        )}
      </div>

      {/* Tasks List */}
      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center card-hover">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckSquare size={28} className="text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {tasks.length === 0 ? 'No tasks yet' : 'All caught up!'}
          </h3>
          <p className="text-text-muted text-sm">
            {tasks.length === 0
              ? 'Add your first task to get started.'
              : 'Great work, Stephens family! All tasks are done.'}
          </p>
          {tasks.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Plus size={16} /> Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending Tasks */}
          {pendingTasks.map((task) => {
            const catStyle = categoryColors[task.category] || categoryColors.other;
            const dueLabel = formatDueDate(task.dueDate);
            const overdue = isDueDateOverdue(task.dueDate) && !task.completed;

            return (
              <div
                key={task.id}
                className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-4 group card-hover transition-all"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(task)}
                  className="w-6 h-6 rounded-lg border-2 border-border hover:border-indigo-500 flex items-center justify-center shrink-0 transition-colors"
                >
                  <span className="sr-only">Complete task</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getMemberColor(task.assignedTo) }}
                      />
                      <span className="text-xs text-text-muted">{getMemberName(task.assignedTo)}</span>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} capitalize`}>
                      {task.category}
                    </span>
                    {task.recurring && task.recurring !== 'none' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center gap-1">
                        <RotateCcw size={9} /> {task.recurring}
                      </span>
                    )}
                    {dueLabel && (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          overdue
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        <CalendarDays size={9} /> {dueLabel}
                        {overdue && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-2 rounded-xl hover:bg-indigo-500/10 text-text-muted hover:text-indigo-600 transition-colors"
                    title="Edit task"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-text-muted hover:text-red-600 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                <ListChecks size={14} />
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map((task) => {
                  const catStyle = categoryColors[task.category] || categoryColors.other;

                  return (
                    <div
                      key={task.id}
                      className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-4 group opacity-60 hover:opacity-80 transition-all"
                    >
                      {/* Checkbox - completed */}
                      <button
                        onClick={() => handleToggle(task)}
                        className="w-6 h-6 rounded-lg bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center shrink-0 transition-colors hover:bg-emerald-600"
                      >
                        <Check size={14} className="text-white" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-through text-text-muted truncate">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: getMemberColor(task.assignedTo) }}
                            />
                            <span className="text-xs text-text-muted">{getMemberName(task.assignedTo)}</span>
                          </div>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} capitalize`}>
                            {task.category}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-2 rounded-xl hover:bg-indigo-500/10 text-text-muted hover:text-indigo-600 transition-colors"
                          title="Edit task"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 rounded-xl hover:bg-red-500/10 text-text-muted hover:text-red-600 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────────────────── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Plus size={14} className="text-white" /></div>}
        title="New Task"
        maxWidth="max-w-md"
      >
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Assign To</label>
                  <select
                    value={createForm.assignedTo || members[0]?.id}
                    onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as Task['category'] })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background capitalize focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {taskCategories.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Recurring</label>
                  <select
                    value={createForm.recurring}
                    onChange={(e) => setCreateForm({ ...createForm, recurring: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {recurringOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!createForm.title.trim() || saving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Create Task
                  </>
                )}
              </button>
      </Modal>

      {/* ── Edit Task Modal ───────────────────────────────────────── */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Pencil size={14} className="text-white" /></div>}
        title="Edit Task"
        maxWidth="max-w-md"
      >
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Assign To</label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Task['category'] })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background capitalize focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {taskCategories.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1.5">Recurring</label>
                  <select
                    value={editForm.recurring}
                    onChange={(e) => setEditForm({ ...editForm, recurring: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {recurringOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleUpdate}
                disabled={!editForm.title.trim() || saving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save Changes
                  </>
                )}
              </button>
      </Modal>
    </div>
  );
}
