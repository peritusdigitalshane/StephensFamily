'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  parseISO,
} from 'date-fns';

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface Meal {
  id: string;
  date: string;
  meal: MealType;
  recipe: string;
  prepBy?: string;
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

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export default function MealsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [modalDate, setModalDate] = useState('');
  const [modalMealType, setModalMealType] = useState<MealType>('dinner');
  const [form, setForm] = useState({ recipe: '', prepBy: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; mealId: string; mealName: string }>({
    open: false,
    mealId: '',
    mealName: '',
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch meals
  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch('/api/meals');
      if (res.ok) {
        const data = await res.json();
        setMeals(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
    fetchMembers();
  }, [fetchMeals, fetchMembers]);

  const getMealsForCell = (date: Date, mealType: MealType) =>
    meals.filter((m) => {
      try {
        return m.date === format(date, 'yyyy-MM-dd') && m.meal === mealType;
      } catch {
        return false;
      }
    });

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name || '';

  const getMemberColor = (id: string) =>
    members.find((m) => m.id === id)?.color || '#8b5cf6';

  // Open modal for adding
  const openAddModal = (date: Date, mealType: MealType) => {
    setEditingMeal(null);
    setModalDate(format(date, 'yyyy-MM-dd'));
    setModalMealType(mealType);
    setForm({ recipe: '', prepBy: '', notes: '' });
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setModalDate(meal.date);
    setModalMealType(meal.meal);
    setForm({
      recipe: meal.recipe,
      prepBy: meal.prepBy || '',
      notes: meal.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMeal(null);
    setForm({ recipe: '', prepBy: '', notes: '' });
  };

  // Create meal
  const handleCreate = async () => {
    if (!form.recipe) return;
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: modalDate,
          meal: modalMealType,
          recipe: form.recipe,
          prepBy: form.prepBy || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        await fetchMeals();
        toast('Meal added successfully', 'success');
        closeModal();
      } else {
        toast('Failed to add meal', 'error');
      }
    } catch (err) {
      console.error('Failed to create meal:', err);
      toast('Failed to add meal', 'error');
    }
  };

  // Update meal
  const handleUpdate = async () => {
    if (!editingMeal || !form.recipe) return;
    try {
      const res = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMeal.id,
          recipe: form.recipe,
          prepBy: form.prepBy || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        await fetchMeals();
        toast('Meal updated successfully', 'success');
        closeModal();
      } else {
        toast('Failed to update meal', 'error');
      }
    } catch (err) {
      console.error('Failed to update meal:', err);
      toast('Failed to update meal', 'error');
    }
  };

  // Delete meal
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchMeals();
        toast('Meal deleted', 'success');
      } else {
        toast('Failed to delete meal', 'error');
      }
    } catch (err) {
      console.error('Failed to delete meal:', err);
      toast('Failed to delete meal', 'error');
    }
  };

  const promptDeleteMeal = (id: string, name: string) => {
    setConfirmDelete({ open: true, mealId: id, mealName: name });
  };

  const handleSubmit = () => {
    if (editingMeal) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  // Copy previous week's meals
  const handleCopyPreviousWeek = async () => {
    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekDays = Array.from({ length: 7 }, (_, i) => addDays(prevWeekStart, i));

    // Find meals from previous week
    const prevWeekMeals = meals.filter((m) => {
      try {
        return prevWeekDays.some((d) => m.date === format(d, 'yyyy-MM-dd'));
      } catch {
        return false;
      }
    });

    if (prevWeekMeals.length === 0) {
      toast('No meals found in the previous week to copy', 'warning');
      return;
    }

    setCopying(true);
    let created = 0;
    let failed = 0;

    for (const meal of prevWeekMeals) {
      try {
        // Calculate the corresponding day in the current week
        const mealDate = parseISO(meal.date);
        const prevStart = startOfWeek(mealDate, { weekStartsOn: 1 });
        const dayOffset = Math.round((mealDate.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
        const newDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');

        const res = await fetch('/api/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: newDate,
            meal: meal.meal,
            recipe: meal.recipe,
            prepBy: meal.prepBy || undefined,
            notes: meal.notes || undefined,
          }),
        });
        if (res.ok) {
          created++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    await fetchMeals();
    setCopying(false);

    if (created > 0 && failed === 0) {
      toast(`Copied ${created} meal${created !== 1 ? 's' : ''} from last week`, 'success');
    } else if (created > 0 && failed > 0) {
      toast(`Copied ${created} meal${created !== 1 ? 's' : ''}, ${failed} failed`, 'warning');
    } else {
      toast('Failed to copy meals from previous week', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meal Planner</h1>
            <p className="text-text-muted text-sm">
              Plan the family meals for the week
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-surface rounded-2xl border border-border p-4 mb-6 card-hover">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-2.5 hover:bg-surface-hover rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-base">
              {format(weekStart, 'd MMM')} &ndash;{' '}
              {format(addDays(weekStart, 6), 'd MMM yyyy')}
            </h2>
            <button
              onClick={handleCopyPreviousWeek}
              disabled={copying}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-border hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 text-text-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy meals from previous week"
            >
              {copying ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
              Copy Previous Week
            </button>
          </div>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-2.5 hover:bg-surface-hover rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed size={20} className="text-purple-400 animate-pulse" />
          </div>
          <p className="text-text-muted text-sm">Loading meals...</p>
        </div>
      ) : (
        /* Meal Grid */
        <div className="bg-surface rounded-2xl border border-border overflow-hidden card-hover">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-24 bg-background/50">
                    Meal
                  </th>
                  {weekDays.map((day) => {
                    const isToday =
                      format(day, 'yyyy-MM-dd') ===
                      format(new Date(), 'yyyy-MM-dd');
                    return (
                      <th
                        key={day.toISOString()}
                        className={`p-4 text-center min-w-[140px] ${
                          isToday ? 'bg-purple-50/50' : 'bg-background/50'
                        }`}
                      >
                        <div
                          className={`text-sm font-semibold ${
                            isToday ? 'text-purple-600' : ''
                          }`}
                        >
                          {format(day, 'EEE')}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isToday
                              ? 'text-purple-500 font-medium'
                              : 'text-text-muted font-normal'
                          }`}
                        >
                          {format(day, 'd MMM')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {mealTypes.map((mealType) => (
                  <tr key={mealType} className="border-t border-border">
                    <td className="p-4 text-sm font-semibold text-text-muted bg-background/50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mealType === 'breakfast'
                              ? 'bg-amber-400'
                              : mealType === 'lunch'
                              ? 'bg-emerald-400'
                              : 'bg-violet-400'
                          }`}
                        />
                        {mealTypeLabels[mealType]}
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const cellMeals = getMealsForCell(day, mealType);
                      const isToday =
                        format(day, 'yyyy-MM-dd') ===
                        format(new Date(), 'yyyy-MM-dd');
                      return (
                        <td
                          key={day.toISOString()}
                          className={`p-2 border-l border-border ${
                            isToday ? 'bg-purple-50/30' : ''
                          }`}
                        >
                          <div className="min-h-[90px] space-y-1.5">
                            {cellMeals.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => openEditModal(m)}
                                className="relative bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/60 rounded-xl p-2.5 text-xs group cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200"
                              >
                                <p className="font-semibold text-purple-900 pr-5">
                                  {m.recipe}
                                </p>
                                {m.prepBy && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: getMemberColor(
                                          m.prepBy
                                        ),
                                      }}
                                    />
                                    <span className="text-purple-600 text-[11px]">
                                      {getMemberName(m.prepBy)}
                                    </span>
                                  </div>
                                )}
                                {m.notes && (
                                  <p className="text-purple-400 mt-1 text-[11px] line-clamp-2">
                                    {m.notes}
                                  </p>
                                )}
                                {/* Edit icon on hover */}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                  <span className="p-1 rounded-lg bg-white/80 text-purple-500 hover:text-purple-700">
                                    <Pencil size={11} />
                                  </span>
                                </div>
                                {/* Delete button on hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    promptDeleteMeal(m.id, m.recipe);
                                  }}
                                  className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-white/80 text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                            {/* Add button */}
                            <button
                              onClick={() => openAddModal(day, mealType)}
                              className="w-full p-2 rounded-xl border border-dashed border-border/80 text-text-muted hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/50 text-xs transition-all duration-200 flex items-center justify-center gap-1"
                            >
                              <Plus size={12} />
                              <span>Add</span>
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Meal Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        icon={<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><UtensilsCrossed size={16} className="text-white" /></div>}
        title={
          <div>
            <div>{editingMeal ? 'Edit Meal' : 'Add Meal'}</div>
            <p className="text-xs text-text-muted font-normal">
              {mealTypeLabels[modalMealType]} &middot;{' '}
              {modalDate && (() => { try { return format(parseISO(modalDate), 'EEE d MMM yyyy'); } catch { return modalDate; } })()}
            </p>
          </div>
        }
        maxWidth="max-w-md"
      >
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">
                  Recipe Name
                </label>
                <input
                  type="text"
                  placeholder="What's cooking? e.g., Spaghetti Bolognese"
                  value={form.recipe}
                  onChange={(e) =>
                    setForm({ ...form, recipe: e.target.value })
                  }
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">
                  Who&apos;s cooking?
                </label>
                <select
                  value={form.prepBy}
                  onChange={(e) =>
                    setForm({ ...form, prepBy: e.target.value })
                  }
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                >
                  <option value="">Not decided</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Any notes? Ingredients to buy, recipe link, etc."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                {editingMeal && (
                  <button
                    onClick={() => {
                      promptDeleteMeal(editingMeal.id, editingMeal.recipe);
                      closeModal();
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!form.recipe}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                >
                  {editingMeal ? 'Save Changes' : 'Add Meal'}
                </button>
              </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, mealId: '', mealName: '' })}
        onConfirm={() => handleDelete(confirmDelete.mealId)}
        title="Delete Meal"
        message={`Are you sure you want to delete "${confirmDelete.mealName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
