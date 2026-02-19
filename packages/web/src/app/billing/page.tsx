'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    setLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-dim)] hover:text-white transition mb-8">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-[var(--text-dim)]">
            Start with 5,000 free tokens. Upgrade anytime.
          </p>
        </div>

        {/* Free Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm tracking-widest text-[var(--text-dim)] mb-1">FREE TIER</div>
              <div className="text-2xl font-bold">5,000 Tokens</div>
              <p className="text-sm text-[var(--text-dim)] mt-2">
                Perfect for trying Aegis. Includes context sync and basic vibe checks.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">$0</div>
              <div className="text-sm text-[var(--text-dim)]">forever</div>
            </div>
          </div>
        </motion.div>

        {/* Paid Tiers */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-8"
          >
            <div className="text-sm tracking-widest text-[var(--text-dim)] mb-2">PRO</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">$20</span>
              <span className="text-[var(--text-dim)]">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited context syncs',
                '500 Vibe Checks/month',
                'Desktop HUD access',
                'Nexus dashboard',
                'Validation reports',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--accent-green)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading === 'pro'}
              className="w-full py-3 glass rounded-xl font-semibold hover:bg-white/5 transition disabled:opacity-50"
            >
              {loading === 'pro' ? 'Loading...' : 'Subscribe to Pro →'}
            </button>
          </motion.div>

          {/* Lifetime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 border-[var(--accent)] glow-purple relative"
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--accent)] rounded-full text-xs font-bold">
              BEST VALUE
            </div>
            <div className="text-sm tracking-widest text-[var(--accent)] mb-2">FOUNDER'S LICENSE</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">$550</span>
              <span className="text-[var(--text-dim)]">one-time</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Pro',
                'Unlimited forever',
                'No monthly fees',
                'Early access to features',
                'Founder Discord',
                'Name in credits',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--accent)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('lifetime')}
              disabled={loading === 'lifetime'}
              className="w-full py-3 bg-[var(--accent)] rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading === 'lifetime' ? 'Loading...' : 'Get Lifetime Access →'}
            </button>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center text-sm text-[var(--text-dim)]">
          <p>Questions? Email <a href="mailto:support@aegis.dev" className="text-[var(--accent)]">support@aegis.dev</a></p>
        </div>
      </div>
    </main>
  );
}
