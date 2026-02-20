'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';

const plans = [
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$20',
    period: '/month',
    description: 'For developers who need full power.',
    cta: 'Subscribe to Pro',
    featured: false,
    features: [
      'Unlimited context syncs',
      '500 Vibe Checks / month',
      'Desktop HUD',
      'Logic Guard',
      'Priority support',
    ],
  },
  {
    id: 'lifetime' as const,
    name: "Founder's License",
    price: '$550',
    period: 'one-time',
    description: 'Everything Pro, forever. No subscription.',
    cta: 'Get lifetime access',
    featured: true,
    badge: 'Best value',
    features: [
      'Everything in Pro, permanently',
      'Unlimited Vibe Checks',
      'Early access to new features',
      'Founder Discord access',
      'Your name in the credits',
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] py-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="text-center">
            <p className="text-sm text-[var(--text-subtle)] tracking-widest uppercase mb-4 font-medium">Pricing</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text)] mb-4">
              Simple, honest pricing
            </h1>
            <p className="text-lg text-[var(--text-muted)]">
              Start with 5,000 free tokens. No credit card required.
            </p>
          </div>
        </div>

        {/* Free tier */}
        <div className="card p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-subtle)] uppercase tracking-widest font-medium mb-1">Free</p>
            <p className="text-lg font-semibold text-[var(--text)]">5,000 Tokens</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Perfect for trying Aegis. Includes context sync and basic vibe checks.
            </p>
          </div>
          <div className="text-right shrink-0 ml-8">
            <p className="text-4xl font-bold text-[var(--text)]">$0</p>
            <p className="text-xs text-[var(--text-subtle)] mt-1">forever</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Paid plans */}
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.featured
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'bg-[var(--surface)] border border-[var(--border)]'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--bg)] text-[var(--text)]">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <p className={`text-xs font-medium uppercase tracking-widest mb-3 ${
                  plan.featured ? 'text-[#777]' : 'text-[var(--text-muted)]'
                }`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.featured ? 'text-[#666]' : 'text-[var(--text-muted)]'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm ${plan.featured ? 'text-[#555]' : 'text-[var(--text-muted)]'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className={`w-4 h-4 shrink-0 ${
                      plan.featured ? 'text-[var(--bg)]' : 'text-[var(--success)]'
                    }`} />
                    <span className={plan.featured ? 'text-[#333]' : 'text-[var(--text-muted)]'}>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                  plan.featured
                    ? 'bg-[var(--bg)] text-[var(--text)] hover:bg-[#111]'
                    : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] hover:border-[#3F3F46]'
                }`}
              >
                {loading === plan.id ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[var(--text-subtle)] mt-8">
          Free tier includes 5,000 tokens. No card required. Cancel anytime.
        </p>

        <p className="text-center text-sm text-[var(--text-subtle)] mt-6">
          Questions?{' '}
          <a href="mailto:support@aegis.dev" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
            support@aegis.dev
          </a>
        </p>
      </div>
    </main>
  );
}
