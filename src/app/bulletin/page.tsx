'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2, Pin, PinOff, Megaphone, Pencil, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { format, parseISO } from 'date-fns';

interface BulletinPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  pinned: boolean;
  category: string;
  createdAt: string;
}

const postCategories = ['announcement', 'reminder', 'note', 'achievement'];
const categoryColors: Record<string, string> = {
  announcement: '#ef4444',
  reminder: '#f59e0b',
  note: '#6366f1',
  achievement: '#10b981',
};

export default function BulletinPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<BulletinPost | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'note' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/bulletin');
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => {
    setEditPost(null);
    setForm({ title: '', content: '', category: 'note' });
    setShowModal(true);
  };

  const openEdit = (post: BulletinPost) => {
    setEditPost(post);
    setForm({ title: post.title, content: post.content, category: post.category });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    if (editPost) {
      await fetch('/api/bulletin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editPost.id, title: form.title, content: form.content, category: form.category }),
      });
      toast('Post updated', 'success');
    } else {
      await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast('Post created', 'success');
    }
    setShowModal(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/bulletin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast('Post deleted', 'success');
    fetchPosts();
  };

  const handleTogglePin = async (post: BulletinPost) => {
    await fetch('/api/bulletin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, pinned: !post.pinned }),
    });
    fetchPosts();
  };

  const filteredPosts = searchQuery
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
            Bulletin Board
          </h1>
          <p className="text-text-muted text-sm mt-1">Family announcements, reminders, and notes</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 font-semibold transition-all">
          <Plus size={16} /> Post
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search posts by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <Megaphone size={24} className="text-red-400" />
          </div>
          <p className="text-text-muted">{searchQuery ? 'No posts match your search.' : 'No posts yet. Be the first to share something!'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`bg-surface rounded-2xl border p-6 group card-hover ${post.pinned ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[post.category] || '#6366f1' }} />
                  <span
                    className="text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${categoryColors[post.category] || '#6366f1'}12`, color: categoryColors[post.category] || '#6366f1' }}
                  >
                    {post.category}
                  </span>
                  {post.pinned && <span className="text-xs text-primary font-semibold">Pinned</span>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleTogglePin(post)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted" title={post.pinned ? 'Unpin' : 'Pin'}>
                    {post.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(post.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
              <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">{post.content}</p>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">{post.author}</span>
                <span className="text-xs text-text-muted">
                  {(() => { try { return format(parseISO(post.createdAt), 'd MMM yyyy, h:mm a'); } catch { return post.createdAt; } })()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editPost ? 'Edit Post' : 'New Post'}
      >
              <div>
                <label className="text-sm font-medium block mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Post title"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Category</label>
                <div className="flex gap-2">
                  {postCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${form.category === cat ? 'text-white shadow-sm' : 'bg-surface-hover text-text-muted'}`}
                      style={form.category === cat ? { backgroundColor: categoryColors[cat] } : {}}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  placeholder="What's on your mind?"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.content}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all"
              >
                {editPost ? 'Save Changes' : 'Post'}
              </button>
      </Modal>
    </div>
  );
}
