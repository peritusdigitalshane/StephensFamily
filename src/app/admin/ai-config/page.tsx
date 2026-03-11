'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Settings, RefreshCw, Check, Eye, EyeOff, Zap, Save } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  owned_by: string;
  created: number;
}

interface AIConfigData {
  apiKey: string;
  selectedModel: string;
  enabledModels: string[];
  availableModels: ModelInfo[];
  maxTokens: number;
  temperature: number;
}

export default function AIConfigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<AIConfigData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role !== 'superadmin') {
      router.push('/');
      return;
    }
    fetchConfig();
  }, [session, router, fetchConfig]);

  const fetchModels = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: `Found ${data.models.length} chat models` });
        fetchConfig();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch models' });
    } finally {
      setFetching(false);
    }
  };

  const saveConfig = async (updates: Partial<AIConfigData> & { apiKey?: string }) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved' });
        fetchConfig();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const toggleModel = (modelId: string) => {
    if (!config) return;
    const current = config.enabledModels || [];
    const updated = current.includes(modelId)
      ? current.filter((m) => m !== modelId)
      : [...current, modelId];
    setConfig({ ...config, enabledModels: updated });
  };

  if (session?.user?.role !== 'superadmin') return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} className="text-primary" />
          AI Configuration
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Configure OpenAI API settings and select available models for the family
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-danger/10 border border-danger/20 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-text-muted">Loading configuration...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* API Key */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              OpenAI API Key
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config?.apiKey ? 'Key configured (enter new key to update)' : 'sk-...'}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background pr-10 font-mono"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (apiKey) saveConfig({ apiKey });
                  }}
                  disabled={!apiKey || saving}
                  className="bg-primary text-white px-4 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} /> Save Key
                </button>
              </div>
              {config?.apiKey && (
                <p className="text-xs text-success flex items-center gap-1">
                  <Check size={12} /> API key is configured
                </p>
              )}
            </div>
          </div>

          {/* Fetch Models */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Available Models</h2>
              <button
                onClick={fetchModels}
                disabled={fetching || (!apiKey && !config?.apiKey)}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark disabled:opacity-50"
              >
                <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
                {fetching ? 'Fetching...' : 'Fetch Models'}
              </button>
            </div>
            <p className="text-text-muted text-xs mb-4">
              Click &quot;Fetch Models&quot; to load all available chat models from your OpenAI API key.
              Then select which models should be available in the AI chat.
            </p>

            {config?.availableModels && config.availableModels.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-auto">
                {config.availableModels.map((model) => {
                  const isEnabled = config.enabledModels?.includes(model.id);
                  const isSelected = config.selectedModel === model.id;
                  return (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isEnabled
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleModel(model.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isEnabled
                              ? 'border-primary bg-primary'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {isEnabled && <Check size={12} className="text-white" />}
                        </button>
                        <div>
                          <p className="text-sm font-medium font-mono">{model.id}</p>
                          <p className="text-xs text-text-muted">
                            {model.owned_by} &middot; {new Date(model.created * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        {isEnabled && !isSelected && (
                          <button
                            onClick={() =>
                              setConfig({ ...config, selectedModel: model.id })
                            }
                            className="text-xs text-primary hover:underline"
                          >
                            Set as default
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-background rounded-lg p-6 text-center border border-border">
                <p className="text-text-muted text-sm">
                  No models fetched yet. Add your API key and click &quot;Fetch Models&quot; to see available models.
                </p>
              </div>
            )}
          </div>

          {/* Model Settings */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-semibold text-lg mb-4">Chat Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Default Model</label>
                <select
                  value={config?.selectedModel || ''}
                  onChange={(e) =>
                    config && setConfig({ ...config, selectedModel: e.target.value })
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  {config?.enabledModels && config.enabledModels.length > 0 ? (
                    config.enabledModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  ) : (
                    <option value={config?.selectedModel || ''}>
                      {config?.selectedModel || 'No models enabled'}
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Max Tokens ({config?.maxTokens || 4096})
                </label>
                <input
                  type="range"
                  min={256}
                  max={16384}
                  step={256}
                  value={config?.maxTokens || 4096}
                  onChange={(e) =>
                    config && setConfig({ ...config, maxTokens: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Temperature ({config?.temperature?.toFixed(1) || '0.7'})
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config?.temperature ?? 0.7}
                  onChange={(e) =>
                    config &&
                    setConfig({ ...config, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={() =>
              config &&
              saveConfig({
                selectedModel: config.selectedModel,
                enabledModels: config.enabledModels,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
              })
            }
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  );
}
