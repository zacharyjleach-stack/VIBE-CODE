"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, AlertTriangle, Infinity as InfinityIcon } from "lucide-react";
import { motion } from "framer-motion";

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
      const response = await fetch("/api/aegis/billing/usage");
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();

    // Poll every 30 seconds to keep usage updated
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full" />
          <div className="flex-1">
            <div className="h-3 bg-white/10 rounded w-24 mb-2" />
            <div className="h-2 bg-white/10 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const isUnlimited = usage.limit === "Unlimited" || usage.remaining === Infinity;
  const percentage = isUnlimited ? 0 : usage.percentage;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  // Color scheme based on usage
  const getColorScheme = () => {
    if (isUnlimited) return {
      bg: "from-amber-500/20 to-yellow-500/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      bar: "bg-gradient-to-r from-amber-500 to-yellow-500",
      icon: InfinityIcon
    };
    if (isCritical) return {
      bg: "from-red-500/20 to-orange-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      bar: "bg-gradient-to-r from-red-500 to-orange-500",
      icon: AlertTriangle
    };
    if (isWarning) return {
      bg: "from-amber-500/20 to-yellow-500/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      bar: "bg-gradient-to-r from-amber-500 to-yellow-500",
      icon: TrendingUp
    };
    return {
      bg: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/50",
      text: "text-green-400",
      bar: "bg-gradient-to-r from-green-500 to-emerald-500",
      icon: Activity
    };
  };

  const colors = getColorScheme();
  const Icon = colors.icon;

  // Format numbers with commas
  const formatNumber = (num: number | string) => {
    if (typeof num === "string") return num;
    return num.toLocaleString();
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 backdrop-blur-xl`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            {usage.tier} Plan
          </div>
          <div className="text-sm font-semibold text-white">
            Daily Usage
          </div>
        </div>
      </div>

      {/* Progress Bar (only show if not unlimited) */}
      {!isUnlimited && (
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs text-gray-400">
              {formatNumber(usage.requestsToday)} / {formatNumber(usage.limit)} requests
            </span>
            <span className={`text-xs font-bold ${colors.text}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${colors.bar} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Unlimited Display */}
      {isUnlimited && (
        <div className="mb-3">
          <div className="flex items-center gap-2 justify-center py-2">
            <InfinityIcon className={`w-6 h-6 ${colors.text}`} />
            <span className={`text-lg font-bold ${colors.text}`}>Unlimited Requests</span>
          </div>
          <div className="text-center text-xs text-gray-400">
            {formatNumber(usage.requestsToday)} requests made today
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {!isUnlimited && (
          <span className="text-gray-400">
            {formatNumber(usage.remaining)} remaining today
          </span>
        )}
        {isUnlimited && (
          <span className="text-gray-400">
            Resets daily at midnight
          </span>
        )}
        {isCritical && !isUnlimited && (
          <a
            href="/pricing"
            className="text-red-400 hover:text-red-300 font-semibold underline"
          >
            Upgrade
          </a>
        )}
        {isWarning && !isCritical && !isUnlimited && (
          <span className={`${colors.text} font-semibold`}>
            ⚠️ Low quota
          </span>
        )}
      </div>

      {/* Critical Warning */}
      {isCritical && !isUnlimited && (
        <motion.div
          className="mt-3 pt-3 border-t border-red-500/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span>
              Almost at daily limit! Upgrade for more requests.
            </span>
          </div>
        </motion.div>
      )}

      {/* Agent Limit Badge */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Agent Limit</span>
          <span className="text-white font-semibold">
            {formatNumber(usage.features.maxAgents)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
