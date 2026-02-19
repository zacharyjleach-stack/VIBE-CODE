'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TokenTank } from './TokenTank';

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
  history: Array<{
    id: string;
    action: string;
    amount: number;
    balanceAfter: number;
    createdAt: Date;
  }>;
  apiKeys: Array<{ id: string; name: string; prefix: string; createdAt: Date }>;
}

export function DashboardClient({ user, history, apiKeys }: Props) {
  const [copied, setCopied] = useState(false);

  const isTrialExpired = user.plan === 'free' && user.balance <= 0;

  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-[var(--accent)] mb-4">
              <span className="text-2xl">⬡</span>
              <span className="font-bold tracking-[0.2em] text-sm">AEGIS</span>
            </Link>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-[var(--text-dim)]">Welcome back, {user.name || user.email}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--text-dim)]">Plan</div>
            <div className="text-lg font-bold capitalize">
              {user.isLifetime ? '⬡ Lifetime' : user.plan}
            </div>
          </div>
        </div>

        {/* Trial Expired Banner */}
        {isTrialExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-bold text-red-400 mb-2">Trial Expired</h3>
            <p className="text-sm text-[var(--text-dim)] mb-4">
              Your 5,000 free tokens have been used. Upgrade to continue using Aegis.
            </p>
            <Link
              href="/billing"
              className="inline-block px-6 py-2 bg-[var(--accent)] rounded-lg font-semibold"
            >
              Upgrade Now →
            </Link>
          </motion.div>
        )}

        {/* Token Tank */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <TokenTank
            balance={user.balance}
            maxBalance={5000}
            isLifetime={user.isLifetime}
            plan={user.plan}
          />

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm tracking-widest text-[var(--text-dim)] mb-4">USAGE TODAY</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Syncs', value: history.filter(h => h.action === 'context_sync').length },
                { label: 'Vibe Checks', value: history.filter(h => h.action === 'vibe_check').length },
                { label: 'Relays', value: history.filter(h => h.action === 'agent_relay').length },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-[var(--text-dim)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm tracking-widest text-[var(--text-dim)]">API KEYS</h3>
            <button className="text-sm text-[var(--accent)] hover:underline">
              + Create Key
            </button>
          </div>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)]">No API keys yet. Create one to connect Aegis CLI.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-mono text-sm">{key.prefix}...</div>
                    <div className="text-xs text-[var(--text-dim)]">{key.name}</div>
                  </div>
                  <button className="text-xs text-red-400 hover:underline">Revoke</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm tracking-widest text-[var(--text-dim)] mb-4">RECENT ACTIVITY</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                <div>
                  <div className="text-sm capitalize">{item.action.replace('_', ' ')}</div>
                  <div className="text-xs text-[var(--text-dim)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${item.amount > 0 ? 'text-red-400' : 'text-[var(--accent-green)]'}`}>
                    {item.amount > 0 ? `-${item.amount}` : '+0'}
                  </div>
                  <div className="text-xs text-[var(--text-dim)]">Bal: {item.balanceAfter}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
