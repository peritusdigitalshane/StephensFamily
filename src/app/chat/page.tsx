'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Send, Bot, Trash2, Loader2, Sparkles } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  isSystem: boolean;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const MAX_INPUT_LENGTH = 2000;

function ChatContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const agentParam = searchParams.get('agent');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(agentParam || 'family-assistant');
  const [messages, setMessages] = useState<Record<string, ChatMsg[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
        if (agentParam && data.find((a: Agent) => a.id === agentParam)) {
          setSelectedAgentId(agentParam);
        } else {
          setSelectedAgentId((prev) => {
            if (data.find((a: Agent) => a.id === prev)) return prev;
            return data.length > 0 ? data[0].id : prev;
          });
        }
      }
    } catch (e) { console.error(e); }
  }, [agentParam]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    if (agentParam) setSelectedAgentId(agentParam);
  }, [agentParam]);

  const currentMessages = messages[selectedAgentId] || [];
  const agent = agents.find((a) => a.id === selectedAgentId);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMsg = { id: `msg-${Date.now()}`, role: 'user', content: input.trim() };
    const updated = [...currentMessages, userMsg];
    setMessages((prev) => ({ ...prev, [selectedAgentId]: updated }));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: agent?.systemPrompt || 'You are a helpful family assistant for the Stephens family.',
        }),
      });
      const data = await response.json();
      const content = response.ok
        ? (data.content || 'Sorry, something went wrong.')
        : (data.error || 'Something went wrong. Check AI Configuration.');
      const assistantMsg: ChatMsg = { id: `msg-${Date.now()}-r`, role: 'assistant', content };
      setMessages((prev) => ({ ...prev, [selectedAgentId]: [...(prev[selectedAgentId] || []), assistantMsg] }));
    } catch {
      const errorMsg: ChatMsg = { id: `msg-${Date.now()}-e`, role: 'assistant', content: 'Could not connect. Make sure the admin has configured the API key in AI Configuration.' };
      setMessages((prev) => ({ ...prev, [selectedAgentId]: [...(prev[selectedAgentId] || []), errorMsg] }));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages((prev) => ({ ...prev, [selectedAgentId]: [] }));
  };

  const userName = session?.user?.name || 'You';
  const userColor = session?.user?.color || '#6366f1';
  const userAvatar = session?.user?.avatar || userName.charAt(0);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold">{agent?.name || 'AI Chat'}</h1>
            <p className="text-xs text-text-muted">{agent?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background"
          >
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button
            onClick={() => {
              if (currentMessages.length > 0) {
                setShowClearConfirm(true);
              }
            }}
            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {currentMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-5">
              <Sparkles size={32} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold mb-1">{agent?.name || 'AI Chat'}</h2>
            <p className="text-text-muted text-sm max-w-md mb-8">{agent?.description || 'Start a conversation with your family AI assistant.'}</p>
            <div className="flex flex-wrap gap-2 max-w-lg justify-center">
              {selectedAgentId === 'family-assistant' && (
                <>
                  <SuggestionChip text="What should we do this weekend?" onClick={setInput} />
                  <SuggestionChip text="Help me plan a family movie night" onClick={setInput} />
                  <SuggestionChip text="What are some fun indoor activities?" onClick={setInput} />
                </>
              )}
              {selectedAgentId === 'meal-planner' && (
                <>
                  <SuggestionChip text="Plan this week's dinners" onClick={setInput} />
                  <SuggestionChip text="Quick meals for busy weeknights" onClick={setInput} />
                </>
              )}
              {selectedAgentId === 'homework-helper' && (
                <>
                  <SuggestionChip text="Help me with fractions" onClick={setInput} />
                  <SuggestionChip text="Explain photosynthesis" onClick={setInput} />
                </>
              )}
              {!['family-assistant', 'meal-planner', 'homework-helper'].includes(selectedAgentId) && agent && (
                <SuggestionChip text={`Hey ${agent.name}, can you help me?`} onClick={setInput} />
              )}
            </div>
          </div>
        )}

        {currentMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-indigo-500" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/15' : 'bg-surface border border-border'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm" style={{ backgroundColor: userColor }}>
                {userAvatar}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-indigo-500" />
            </div>
            <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-text-muted ml-1">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-surface border-t border-border p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_INPUT_LENGTH) {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message ${agent?.name || 'assistant'}...`}
              className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              rows={1}
              maxLength={MAX_INPUT_LENGTH}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </div>
          {input.length > 0 && (
            <div className="flex justify-end mt-1.5">
              <span className={`text-[11px] ${input.length > MAX_INPUT_LENGTH * 0.9 ? 'text-amber-500' : 'text-text-muted'}`}>
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Clear Chat Confirmation */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearChat}
        title="Clear Chat"
        message="Are you sure you want to clear this conversation? All messages will be lost."
        confirmLabel="Clear"
        confirmVariant="danger"
      />
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button onClick={() => onClick(text)} className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-surface hover:shadow-sm transition-all text-text-muted hover:text-foreground">
      {text}
    </button>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
      <ChatContent />
    </Suspense>
  );
}
