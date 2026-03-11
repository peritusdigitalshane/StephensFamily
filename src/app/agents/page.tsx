'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bot, Plus, X, Trash2, Pencil, MessageCircle, Home, BookOpen, Sparkles } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  createdBy: string;
  isSystem: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  BookOpen: <BookOpen size={20} />,
  ChefHat: <Sparkles size={20} />,
  Bot: <Bot size={20} />,
};

const emptyForm = { name: '', description: '', systemPrompt: '', icon: 'Bot' };

export default function AgentsPage() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) setAgents(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const openCreate = () => {
    setEditAgent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, description: agent.description, systemPrompt: agent.systemPrompt, icon: agent.icon });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.systemPrompt) return;
    if (editAgent) {
      await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editAgent.id, ...form }),
      });
    } else {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    fetchAgents();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/agents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchAgents();
  };

  const systemAgents = agents.filter((a) => a.isSystem);
  const customAgents = agents.filter((a) => !a.isSystem);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            AI Agents
          </h1>
          <p className="text-text-muted text-sm mt-1">Create and manage custom AI assistants for your family</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 font-semibold transition-all">
          <Plus size={16} /> New Agent
        </button>
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <p className="text-text-muted text-sm">Loading agents...</p>
        </div>
      ) : (
        <>
          {systemAgents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Built-in Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {systemAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Custom Agents</h2>
            {customAgents.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border border-dashed p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-3">
                  <Bot size={24} className="text-cyan-400" />
                </div>
                <p className="text-text-muted text-sm mb-3">No custom agents yet</p>
                <button onClick={openCreate} className="text-primary text-sm font-semibold hover:underline">
                  Create your first agent
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editAgent ? 'Edit Agent' : 'Create Agent'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-hover rounded-xl"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Agent Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Travel Planner" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="What does this agent do?" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">System Prompt</label>
                <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={5} placeholder="Instructions that define the agent's personality and capabilities." />
              </div>
              <button onClick={handleSave} disabled={!form.name || !form.systemPrompt}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all">
                {editAgent ? 'Save Changes' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, onEdit, onDelete }: { agent: Agent; onEdit: (a: Agent) => void; onDelete: (id: string) => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center text-cyan-600">
          {iconMap[agent.icon] || <Bot size={20} />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(agent)} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary">
            <Pencil size={13} />
          </button>
          {!agent.isSystem && (
            <button onClick={() => onDelete(agent.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
      <p className="text-xs text-text-muted line-clamp-2 mb-4">{agent.description}</p>
      <div className="flex items-center gap-2">
        {agent.isSystem && <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-surface-hover px-2 py-0.5 rounded-full">Built-in</span>}
        <Link href={`/chat?agent=${agent.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <MessageCircle size={12} /> Chat now
        </Link>
      </div>
    </div>
  );
}
