'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Calendar as CalendarIcon,
  Clock,
  User,
  Tag,
  Repeat,
  FileText,
  Loader2,
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  memberId: string;
  category: 'pickup' | 'work' | 'school' | 'appointment' | 'activity' | 'deadline' | 'other';
  recurring: 'daily' | 'weekly' | 'monthly' | null;
  notes?: string;
  createdBy?: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const categories: CalendarEvent['category'][] = [
  'pickup', 'work', 'school', 'appointment', 'activity', 'deadline', 'other',
];

const categoryColors: Record<string, string> = {
  pickup: '#10b981',
  work: '#6366f1',
  school: '#f59e0b',
  appointment: '#ec4899',
  activity: '#8b5cf6',
  deadline: '#ef4444',
  other: '#64748b',
};

const categoryGradients: Record<string, string> = {
  pickup: 'from-emerald-500 to-teal-600',
  work: 'from-indigo-500 to-blue-600',
  school: 'from-amber-500 to-yellow-600',
  appointment: 'from-pink-500 to-rose-600',
  activity: 'from-violet-500 to-purple-600',
  deadline: 'from-red-500 to-rose-600',
  other: 'from-slate-500 to-gray-600',
};

const defaultFormState = {
  title: '',
  date: '',
  time: '',
  endTime: '',
  memberId: '',
  category: 'other' as CalendarEvent['category'],
  recurring: null as CalendarEvent['recurring'],
  notes: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { data: session } = useSession();

  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterMember, setFilterMember] = useState<string>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(defaultFormState);

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : data.events ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : data.members ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchEvents(), fetchMembers()]).finally(() => setLoading(false));
  }, [fetchEvents, fetchMembers]);

  /* ---------------------------------------------------------------- */
  /*  CRUD handlers                                                    */
  /* ---------------------------------------------------------------- */

  const handleSaveEvent = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      if (editingEvent) {
        // UPDATE
        const res = await fetch('/api/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEvent.id,
            title: form.title,
            date: form.date,
            time: form.time || undefined,
            endTime: form.endTime || undefined,
            memberId: form.memberId,
            category: form.category,
            recurring: form.recurring,
            notes: form.notes || undefined,
          }),
        });
        if (res.ok) {
          await fetchEvents();
        }
      } else {
        // CREATE
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            date: form.date,
            time: form.time || undefined,
            endTime: form.endTime || undefined,
            memberId: form.memberId,
            category: form.category,
            recurring: form.recurring,
            notes: form.notes || undefined,
          }),
        });
        if (res.ok) {
          await fetchEvents();
        }
      }
    } catch (err) {
      console.error('Failed to save event:', err);
    } finally {
      setSaving(false);
      closeModal();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Modal helpers                                                    */
  /* ---------------------------------------------------------------- */

  const openCreateModal = (date?: Date) => {
    const d = date || selectedDate || new Date();
    setEditingEvent(null);
    setForm({
      ...defaultFormState,
      date: format(d, 'yyyy-MM-dd'),
      memberId: members[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time || '',
      endTime: event.endTime || '',
      memberId: event.memberId,
      category: event.category,
      recurring: event.recurring,
      notes: event.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setForm(defaultFormState);
  };

  /* ---------------------------------------------------------------- */
  /*  Calendar grid computation                                        */
  /* ---------------------------------------------------------------- */

  const filteredEvents = useMemo(() => {
    if (filterMember === 'all') return events;
    return events.filter((e) => e.memberId === filterMember);
  }, [events, filterMember]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (date: Date) =>
    filteredEvents.filter((e) => {
      try {
        return isSameDay(parseISO(e.date), date);
      } catch {
        return false;
      }
    });

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  /* ---------------------------------------------------------------- */
  /*  Helper lookups                                                   */
  /* ---------------------------------------------------------------- */

  const getMemberColor = (id: string) =>
    members.find((m) => m.id === id)?.color || '#64748b';
  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name || id;

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm text-text-muted">Loading calendar...</p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ---- Header ---- */}
      <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/15" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Family Calendar</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {format(new Date(), 'EEEE, d MMMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Member Filter */}
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="text-sm rounded-xl px-3 py-2 bg-white/20 text-white border border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-gray-900"
            >
              <option value="all">Everyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              onClick={() => openCreateModal()}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all"
            >
              <Plus size={16} /> New Event
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Calendar Grid ---- */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 card-hover shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2.5 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all border border-transparent hover:border-indigo-200"
            >
              <ChevronLeft size={20} className="text-indigo-600" />
            </button>
            <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2.5 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all border border-transparent hover:border-indigo-200"
            >
              <ChevronRight size={20} className="text-indigo-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-text-muted uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const dayEvents = getEventsForDay(d);
              const isSelected = selectedDate && isSameDay(d, selectedDate);
              const today = isToday(d);
              const inMonth = isSameMonth(d, currentDate);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`
                    relative p-2 min-h-[85px] rounded-xl text-left transition-all duration-200
                    ${!inMonth ? 'opacity-30' : 'hover:bg-indigo-50/50'}
                    ${today ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm' : ''}
                    ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 shadow-md' : ''}
                  `}
                >
                  <span
                    className={`
                      text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-lg
                      ${today ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : ''}
                    `}
                  >
                    {format(d, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md truncate text-white font-medium bg-gradient-to-r ${categoryGradients[e.category] || categoryGradients.other}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-indigo-500 font-medium">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Side Panel ---- */}
        <div className="space-y-5">
          {/* Selected Day Events */}
          <div className="bg-surface rounded-2xl border border-border p-6 card-hover shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">
                {selectedDate ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    {format(selectedDate, 'EEE, d MMM')}
                  </span>
                ) : (
                  'Select a day'
                )}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus size={14} /> Add
                </button>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon size={32} className="mx-auto text-text-muted/30 mb-2" />
                <p className="text-text-muted text-sm">
                  {selectedDate ? 'Nothing planned for this day.' : 'Click a date to view events.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-3.5 rounded-xl bg-background border border-border/50 group hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => openEditModal(e)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div
                          className="w-1 h-full min-h-[32px] rounded-full shrink-0"
                          style={{ backgroundColor: getMemberColor(e.memberId) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{e.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {(e.time || e.endTime) && (
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                <Clock size={10} />
                                {e.time}{e.endTime && ` - ${e.endTime}`}
                              </span>
                            )}
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <User size={10} />
                              {getMemberName(e.memberId)}
                            </span>
                          </div>
                          {e.notes && (
                            <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{e.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium bg-gradient-to-r ${categoryGradients[e.category] || categoryGradients.other}`}
                            >
                              {e.category}
                            </span>
                            {e.recurring && (
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium flex items-center gap-0.5">
                                <Repeat size={8} />
                                {e.recurring}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEditModal(e);
                          }}
                          className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDeleteEvent(e.id);
                          }}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Legend */}
          <div className="bg-surface rounded-2xl border border-border p-5 card-hover shadow-sm">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag size={12} />
              Categories
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-md bg-gradient-to-br ${categoryGradients[cat]}`}
                  />
                  <span className="text-xs font-medium capitalize">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-surface rounded-2xl border border-border p-5 card-hover shadow-sm">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              This Month
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {events.filter((e) => {
                    try {
                      const d = parseISO(e.date);
                      return isSameMonth(d, currentDate);
                    } catch {
                      return false;
                    }
                  }).length}
                </p>
                <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide mt-0.5">Events</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {selectedDayEvents.length}
                </p>
                <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide mt-0.5">Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Create / Edit Event Modal ---- */}
      <Modal
        open={showModal}
        onClose={closeModal}
        gradientHeader
        icon={editingEvent ? <Edit3 size={18} /> : <Plus size={18} />}
        title={editingEvent ? 'Edit Event' : 'New Event'}
        footer={
          <>
            {editingEvent && (
              <button
                onClick={() => {
                  handleDeleteEvent(editingEvent.id);
                  closeModal();
                }}
                className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className={`flex items-center gap-2 ${!editingEvent ? 'ml-auto' : ''}`}>
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!form.title || !form.date || saving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </>
        }
      >
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="What's happening?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  autoFocus
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon size={12} />
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* Member + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <User size={12} />
                    Assigned To
                  </label>
                  <select
                    value={form.memberId}
                    onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  >
                    <option value="">Select member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Tag size={12} />
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as CalendarEvent['category'] })}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Repeat size={12} />
                  Recurring
                </label>
                <select
                  value={form.recurring || ''}
                  onChange={(e) => setForm({ ...form, recurring: (e.target.value || null) as CalendarEvent['recurring'] })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                >
                  <option value="">One-off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} />
                  Notes
                </label>
                <textarea
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                  rows={2}
                />
              </div>
      </Modal>
    </div>
  );
}
