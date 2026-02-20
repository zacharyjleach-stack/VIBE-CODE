'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, Zap, Building2, Rocket, Sparkles } from 'lucide-react';

/* ─────────────────────────── data ─────────────────────────── */

const ease = [0.16, 1, 0.3, 1] as const;

const tiers = [
  {
    id: 'free',
    name: 'Starter',
    monthlyPrice: 0,
    description: 'Try the platform. No card required.',
    icon: Sparkles,
    iconColor: 'text-[#71717a]',
    iconBg: 'bg-[#1c1c1f]',
    requests: '10 / day',
    agents: '1',
    badge: null,
    features: [
      'Iris AI chat (Haiku model)',
      '1 concurrent Aegis agent',
      '10 requests per day',
      'Community support',
      'Public project only',
    ],
    cta: 'Get started free',
    ctaStyle: 'btn-secondary',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Builder',
    monthlyPrice: 18,
    description: 'For developers shipping real products.',
    icon: Zap,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
    requests: '100 / day',
    agents: '4',
    badge: null,
    features: [
      'Iris + Aegis full access',
      '4 concurrent agents',
      '100 requests per day',
      'GitHub & VS Code integration',
      'Priority email support',
      'Private projects',
    ],
    cta: 'Start building',
    ctaStyle: 'btn-secondary',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 80,
    description: 'Maximum agents, maximum throughput.',
    icon: Rocket,
    iconColor: 'text-violet-300',
    iconBg: 'bg-violet-500/15',
    requests: '1,000 / day',
    agents: '16',
    badge: 'Most popular',
    features: [
      'Full 16-agent swarm',
      '1,000 requests per day',
      'All AI models (Claude Opus, GPT-4o)',
      'All integrations',
      'Custom deployment targets',
      '24 / 7 priority support',
      'Team seats (up to 5)',
    ],
    cta: 'Go Pro',
    ctaStyle: 'btn-primary',
    highlight: true,
  },
  {
    id: 'ultra',
    name: 'Enterprise',
    monthlyPrice: 170,
    description: 'Unlimited scale for serious teams.',
    icon: Building2,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    requests: 'Unlimited',
    agents: 'Unlimited',
    badge: null,
    features: [
      'Unlimited agents & requests',
      'White-label option',
      'REST API access',
      'Custom model fine-tuning',
      'Dedicated Slack channel',
      'SLA guarantee',
      'Unlimited team seats',
    ],
    cta: 'Contact sales',
    ctaStyle: 'btn-secondary',
    highlight: false,
  },
] as const;

/* ─────────────────────────── components ─────────────────────────── */

function PricingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(false)}
        className={`text-sm transition-colors ${!annual ? 'text-[#fafafa] font-medium' : 'text-[#52525b]'}`}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(!annual)}
        className="relative h-6 w-11 rounded-full border border-[#27272a] bg-[#111113] transition-colors"
        role="switch"
        aria-checked={annual}
      >
        <motion.div
          className="absolute top-0.5 h-5 w-5 rounded-full bg-violet-500 shadow-sm"
          animate={{ x: annual ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(true)}
          className={`text-sm transition-colors ${annual ? 'text-[#fafafa] font-medium' : 'text-[#52525b]'}`}
        >
          Annual
        </button>
        <AnimatePresence>
          {annual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20"
            >
              Save 20%
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TierCard({
  tier,
  annual,
  index,
}: {
  tier: (typeof tiers)[number];
  annual: boolean;
  index: number;
}) {
  const [loading, setLoading] = useState(false);
  const price = annual && tier.monthlyPrice > 0
    ? Math.round(tier.monthlyPrice * 0.8)
    : tier.monthlyPrice;

  const Icon = tier.icon;

  const handleClick = async () => {
    if (tier.id === 'free') { window.location.href = '/iris'; return; }
    if (tier.id === 'ultra') { window.open('mailto:hello@vibecode.app', '_blank'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/aegis/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id.toUpperCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch {
      // Stripe checkout would redirect; for now just reset
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: index * 0.08 }}
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
        tier.highlight
          ? 'border-violet-500/40 bg-[#0d0d14] shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_8px_32px_rgba(139,92,246,0.1)]'
          : 'border-[#27272a] bg-[#111113] hover:border-[#3f3f46]'
      }`}
    >
      {/* Popular badge */}
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
          {tier.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tier.iconBg}`}>
            <Icon className={`h-4 w-4 ${tier.iconColor}`} strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-[#fafafa]">{tier.name}</h3>
          <p className="mt-0.5 text-sm text-[#71717a]">{tier.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold tracking-tight text-[#fafafa]">
            {tier.monthlyPrice === 0 ? 'Free' : `£${price}`}
          </span>
          {tier.monthlyPrice > 0 && (
            <span className="mb-1.5 text-sm text-[#52525b]">/ mo{annual ? ', billed annually' : ''}</span>
          )}
        </div>
        {annual && tier.monthlyPrice > 0 && (
          <p className="mt-1 text-xs text-[#52525b] line-through">
            £{tier.monthlyPrice} / mo without annual discount
          </p>
        )}
      </div>

      {/* Usage stats */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[#1c1c1f] bg-[#0f0f11] p-3">
          <div className="mb-0.5 text-xs text-[#52525b]">Requests</div>
          <div className="text-sm font-semibold text-[#fafafa]">{tier.requests}</div>
        </div>
        <div className="rounded-lg border border-[#1c1c1f] bg-[#0f0f11] p-3">
          <div className="mb-0.5 text-xs text-[#52525b]">Agents</div>
          <div className="text-sm font-semibold text-[#fafafa]">{tier.agents}</div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn w-full justify-center ${tier.ctaStyle} mb-6`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            Processing…
          </span>
        ) : tier.cta}
      </button>

      {/* Divider */}
      <div className="mb-5 h-px bg-[#1c1c1f]" />

      {/* Features */}
      <ul className="flex flex-col gap-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#a1a1aa]">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" strokeWidth={2} />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[#1c1c1f] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => router.push('/')}
            className="btn-ghost btn gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm font-medium text-[#a1a1aa]">Pricing</span>
          <div className="w-16" />
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#111113] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-[#71717a]">Simple, transparent pricing</span>
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight text-[#fafafa]">
            Pick your tier
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg text-[#71717a]">
            All plans include Iris AI chat and the Aegis build engine.
            No token counting — just daily request limits.
          </p>

          <PricingToggle annual={annual} onChange={setAnnual} />
        </motion.div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} annual={annual} index={i} />
          ))}
        </div>

        {/* FAQ footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 rounded-xl border border-[#1c1c1f] bg-[#111113] p-5 text-center"
        >
          <p className="text-sm text-[#71717a]">
            All plans auto-renew. Daily limits reset at midnight UTC.
            Upgrade, downgrade, or cancel anytime.{' '}
            <a href="mailto:hello@vibecode.app" className="text-violet-400 hover:text-violet-300 transition-colors">
              Questions? Talk to us.
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
