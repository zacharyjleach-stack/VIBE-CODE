'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Plus, Trash2, Key, Activity, Zap } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
}

interface HistoryItem {
  id: string;
  action: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
}

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    balance: number;
    isLifetime: boolean;
    plan: string;
    status: string;
  };
  history: HistoryItem[];
  apiKeys: ApiKey[];
}

const ACTION_LABELS: Record<string, string> = {
  context_sync: 'Context Sync',
  vibe_check: 'Vibe Check',
  agent_relay: 'Agent Relay',
  logic_guard: 'Logic Guard',
  token_topup: 'Token Top-up',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function DashboardClient({ user, history, apiKeys: initialKeys }: Props) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTrialExpired = user.plan === 'free' && user.balance <= 0 && !user.isLifetime;
  const balancePct = user.isLifetime ? 100 : Math.min(100, (user.balance / 5000) * 100);
  const isLow = balancePct < 20 && !user.isLifetime;

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setNewKeyValue(data.key);
      setApiKeys((prev) => [
        { id: data.id, name: data.name, keyPrefix: data.keyPrefix, createdAt: new Date() },
        ...prev,
      ]);
      setNewKeyName('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    setRevoking(id);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke key');
      }
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] py-20 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <span className="font-semibold text-[var(--text)] tracking-tight group-hover:opacity-80 transition">
                Aegis
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {user.name || user.email}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
              user.isLifetime
                ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                : user.plan === 'pro'
                ? 'bg-[var(--success-dim)] text-[var(--success)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
            }`}>
              {user.isLifetime ? "Founder's License" : user.plan === 'pro' ? 'Pro' : 'Free'}
            </span>
            <Link
              href="/billing"
              className="block text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] mt-2 transition"
            >
              Manage billing →
            </Link>
          </div>
        </div>

        {/* Trial expired banner */}
        {isTrialExpired && (
          <div className="mb-8 p-5 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-sm font-medium text-red-400 mb-1">Trial tokens exhausted</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Your 5,000 free tokens have been used. Upgrade to continue.
            </p>
            <Link href="/billing" className="btn-primary text-xs py-2 px-4">
              Upgrade now
            </Link>
          </div>
        )}

        {/* New key reveal banner */}
        {newKeyValue && (
          <div className="mb-8 p-5 rounded-xl border border-[var(--success)] bg-[var(--success-dim)]">
            <p className="text-sm font-medium text-[var(--success)] mb-2">API key created — copy it now</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              This key will not be shown again. Store it somewhere safe.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-xs text-[var(--text-muted)] break-all">
              <span className="flex-1">{newKeyValue}</span>
              <CopyButton text={newKeyValue} />
            </div>
            <button
              onClick={() => setNewKeyValue(null)}
              className="mt-3 text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column — main content */}
          <div className="md:col-span-2 space-y-6">

            {/* Token balance */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text)]">Token Balance</span>
                </div>
                {!user.isLifetime && (
                  <span className={`text-xs font-medium ${isLow ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}>
                    {user.balance.toLocaleString()} / 5,000
                  </span>
                )}
              </div>

              {user.isLifetime ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[var(--accent)]">∞</span>
                  <span className="text-sm text-[var(--text-muted)]">Unlimited tokens</span>
                </div>
              ) : (
                <>
                  <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        balancePct < 10 ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-[var(--accent)]'
                      }`}
                      style={{ width: `${balancePct}%` }}
                    />
                  </div>
                  {isLow && (
                    <p className="text-xs text-orange-400 mt-2">
                      Running low — <Link href="/billing" className="underline">upgrade for unlimited access</Link>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* API Keys */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text)]">API Keys</span>
                </div>
                {!showCreateForm && apiKeys.length < 5 && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[#3F3F46] px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New key
                  </button>
                )}
              </div>

              {/* Create form */}
              {showCreateForm && (
                <div className="mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)]">
                  <p className="text-xs text-[var(--text-muted)] mb-3 font-medium">Create new API key</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key name (e.g. cursor-dev)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[var(--accent)] transition"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateKey}
                      disabled={creating || !newKeyName.trim()}
                      className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                    >
                      {creating ? '...' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowCreateForm(false); setNewKeyName(''); }}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 mb-3">{error}</p>
              )}

              {apiKeys.length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)] py-4 text-center">
                  No API keys yet. Create one to connect the Aegis CLI.
                </p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-subtle)] group"
                    >
                      <div>
                        <div className="font-mono text-xs text-[var(--text)]">{key.keyPrefix}</div>
                        <div className="text-xs text-[var(--text-subtle)] mt-0.5">{key.name}</div>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={revoking === key.id}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {revoking === key.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {apiKeys.length >= 5 && (
                <p className="text-xs text-[var(--text-subtle)] mt-3 text-center">
                  Maximum 5 keys reached. Revoke one to create another.
                </p>
              )}
            </div>

            {/* Activity */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text)]">Recent Activity</span>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)] py-4 text-center">
                  No activity yet. Connect the Aegis CLI to get started.
                </p>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div>
                        <div className="text-sm text-[var(--text)]">
                          {ACTION_LABELS[item.action] ?? item.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-[var(--text-subtle)] mt-0.5">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${
                          item.amount > 0 ? 'text-[var(--text-muted)]' : 'text-[var(--success)]'
                        }`}>
                          {item.amount > 0 ? `−${item.amount}` : `+${Math.abs(item.amount)}`}
                        </div>
                        <div className="text-xs text-[var(--text-subtle)] mt-0.5">
                          {item.balanceAfter.toLocaleString()} left
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — reference */}
          <div className="space-y-4">

            {/* Plan card */}
            <div className="card p-5">
              <p className="text-xs text-[var(--text-subtle)] uppercase tracking-widest mb-3 font-medium">Your plan</p>
              <p className="text-base font-semibold text-[var(--text)] mb-1">
                {user.isLifetime ? "Founder's License" : user.plan === 'pro' ? 'Pro' : 'Free Trial'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                {user.isLifetime
                  ? 'Unlimited access, no subscription'
                  : user.plan === 'pro'
                  ? 'Unlimited syncs, 500 Vibe Checks/mo'
                  : `${user.balance.toLocaleString()} tokens remaining`}
              </p>
              {!user.isLifetime && (
                <Link href="/billing" className="btn-secondary text-xs py-2 px-3 w-full text-center">
                  {user.plan === 'pro' ? 'Manage plan' : 'Upgrade'}
                </Link>
              )}
            </div>

            {/* Token costs */}
            <div className="card p-5">
              <p className="text-xs text-[var(--text-subtle)] uppercase tracking-widest mb-3 font-medium">
                Token costs
              </p>
              <div className="space-y-2">
                {[
                  { action: 'Context Sync', cost: 1 },
                  { action: 'Vibe Check', cost: 10 },
                  { action: 'Agent Relay', cost: 5 },
                  { action: 'Logic Guard', cost: 8 },
                ].map(({ action, cost }) => (
                  <div key={action} className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">{action}</span>
                    <span className="text-xs font-mono text-[var(--text-subtle)]">{cost} tok</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick start */}
            <div className="card p-5">
              <p className="text-xs text-[var(--text-subtle)] uppercase tracking-widest mb-3 font-medium">
                Quick start
              </p>
              <div className="space-y-2">
                {[
                  'npm install -g aegis-cli',
                  'aegis login',
                  'aegis sync',
                ].map((cmd) => (
                  <div
                    key={cmd}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-subtle)]"
                  >
                    <code className="text-xs font-mono text-[var(--text-muted)] truncate">{cmd}</code>
                    <CopyButton text={cmd} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
