'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsageData {
  requestsToday: number;
  limit: number | string;
  percentage: number;
  remaining: number | string;
  tier: string;
  subscriptionEnd: string;
  features: {
    requestsPerDay: number | string;
    maxAgents: number | string;
    integrations: string[];
    aiModels: string[];
  };
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/aegis/billing/usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#27272a] rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-[#27272a] rounded w-20" />
            <div className="h-2 bg-[#27272a] rounded w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const isUnlimited = usage.limit === 'Unlimited' || usage.remaining === Infinity;
  const percentage = isUnlimited ? 0 : usage.percentage;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  const Icon = isUnlimited ? InfinityIcon : isCritical ? AlertTriangle : isWarning ? TrendingUp : Activity;

  const barColor = isCritical
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : isUnlimited
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const dotColor = isCritical
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : isUnlimited
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const textColor = isCritical
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : isUnlimited
    ? 'text-amber-400'
    : 'text-emerald-400';

  const formatNumber = (num: number | string) =>
    typeof num === 'string' ? num : num.toLocaleString();

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center">
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#52525b]">
            {usage.tier} Plan
          </p>
          <p className="text-xs font-semibold text-[#a1a1aa]">Daily Usage</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#18181b] border border-[#27272a]`}>
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className={`text-[10px] font-medium ${textColor}`}>
            {isUnlimited ? '∞' : `${Math.round(percentage)}%`}
          </span>
        </div>
      </div>

      {/* Progress / Unlimited */}
      {!isUnlimited ? (
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-[11px] text-[#52525b]">
              {formatNumber(usage.requestsToday)} / {formatNumber(usage.limit)}
            </span>
            <span className="text-[11px] text-[#71717a]">{formatNumber(usage.remaining)} left</span>
          </div>
          <div className="h-1 bg-[#27272a] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 py-1">
          <InfinityIcon className={`w-4 h-4 ${textColor}`} />
          <span className={`text-xs font-semibold ${textColor}`}>Unlimited</span>
          <span className="text-[11px] text-[#52525b] ml-auto">
            {formatNumber(usage.requestsToday)} today
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#27272a]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#52525b]">Agents</span>
          <span className="text-[10px] font-semibold text-[#71717a]">{formatNumber(usage.features.maxAgents)}</span>
        </div>
        {isCritical && !isUnlimited && (
          <a
            href="/pricing"
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            Upgrade →
          </a>
        )}
        {isWarning && !isCritical && !isUnlimited && (
          <span className="text-[11px] text-amber-400 font-medium">Low quota</span>
        )}
      </div>

      {isCritical && !isUnlimited && (
        <motion.div
          className="mt-2.5 flex items-center gap-1.5 text-[11px] text-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>Almost at limit — upgrade for more requests</span>
        </motion.div>
      )}
    </motion.div>
  );
}
