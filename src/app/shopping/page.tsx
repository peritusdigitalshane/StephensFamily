'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Check, ShoppingCart, Pencil, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  addedBy: string;
  checked: boolean;
}

const categories = ['groceries', 'household', 'school', 'other'];

export default function ShoppingPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', category: 'groceries' });
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping');
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!newItem.name) return;
    await fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    toast(`Added "${newItem.name}" to the list`, 'success');
    setNewItem({ name: '', quantity: '', category: 'groceries' });
    fetchItems();
  };

  const handleToggle = async (item: ShoppingItem) => {
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    });
    toast(item.checked ? `Unchecked "${item.name}"` : `Checked off "${item.name}"`, 'success');
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/shopping', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const handleEdit = async () => {
    if (!editItem) return;
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editItem.id, name: editItem.name, quantity: editItem.quantity, category: editItem.category }),
    });
    setEditItem(null);
    fetchItems();
  };

  const handleClearChecked = async () => {
    await fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clearChecked' }),
    });
    toast('Cleared all checked items', 'success');
    fetchItems();
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const filterBySearch = (list: ShoppingItem[]) =>
    searchQuery ? list.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const groupedItems = categories
    .map((cat) => ({ category: cat, items: filterBySearch(unchecked).filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0);

  const filteredChecked = filterBySearch(checked);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            Shopping List
          </h1>
          <p className="text-text-muted text-sm mt-1">{unchecked.length} items to get</p>
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add an item..."
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            min="1"
            placeholder="Qty"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-20 border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleAdd}
            disabled={!newItem.name}
            className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 rounded-xl hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <ShoppingCart size={24} className="text-white" />
          </div>
          <p className="text-text-muted text-sm">Loading shopping list...</p>
        </div>
      ) : groupedItems.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={24} className="text-pink-400" />
          </div>
          <p className="text-text-muted">{searchQuery ? 'No items match your search.' : 'Shopping list is empty! Add items above.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <div key={group.category} className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-hover border-b border-border">
                <h3 className="text-sm font-semibold capitalize">{group.category}</h3>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-surface-hover transition-colors">
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-5 h-5 rounded-md border-2 border-border hover:border-primary shrink-0 transition-colors"
                    />
                    <span className="text-sm flex-1">{item.name}</span>
                    {item.quantity && (
                      <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded-full">{item.quantity}</span>
                    )}
                    <span className="text-xs text-text-muted">{item.addedBy}</span>
                    <button onClick={() => setEditItem(item)} className="opacity-0 group-hover:opacity-100 text-text-muted p-1 rounded hover:bg-primary/10 hover:text-primary transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-danger p-1 rounded hover:bg-danger/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checked Items */}
      {filteredChecked.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-muted">Checked off ({filteredChecked.length})</h3>
            <button onClick={() => setShowClearConfirm(true)} className="text-xs text-danger hover:underline">Clear all</button>
          </div>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border opacity-60">
            {filteredChecked.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                <button
                  onClick={() => handleToggle(item)}
                  className="w-5 h-5 rounded-md border-2 border-success bg-success flex items-center justify-center shrink-0"
                >
                  <Check size={12} className="text-white" />
                </button>
                <span className="text-sm flex-1 line-through text-text-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Checked Confirm Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearChecked}
        title="Clear Checked Items"
        message="Are you sure you want to remove all checked items from the list? This cannot be undone."
        confirmLabel="Clear All"
        confirmVariant="danger"
      />

      {/* Edit Modal */}
      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Item"
        maxWidth="max-w-md"
      >
        {editItem && (
          <>
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <input
                type="text"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                value={editItem.quantity}
                onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={handleEdit}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Save Changes
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
