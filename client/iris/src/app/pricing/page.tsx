"use client";

import { useState } from "react";
import { Check, Zap, Crown, Sparkles, Infinity } from "lucide-react";
import { motion } from "framer-motion";

const tiers = [
  {
    name: "Free",
    price: 0,
    requests: "10/day",
    agents: "1",
    description: "Perfect for trying out Iris & Aegis",
    features: [
      "10 requests per day",
      "Basic AI chat (Haiku)",
      "1 concurrent agent",
      "Community support"
    ],
    cta: "Get Started",
    icon: Sparkles,
    color: "from-gray-500/20 to-gray-600/20",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    buttonStyle: "bg-gray-700 hover:bg-gray-600 text-white"
  },
  {
    name: "Starter",
    price: 18,
    requests: "100/day",
    agents: "4",
    description: "For developers building real projects",
    features: [
      "100 requests per day",
      "Advanced AI (Haiku & Sonnet)",
      "4 concurrent agents",
      "Priority support",
      "GitHub + VS Code integration"
    ],
    cta: "Subscribe",
    icon: Zap,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
    buttonStyle: "bg-blue-600 hover:bg-blue-500 text-white"
  },
  {
    name: "Pro",
    price: 80,
    requests: "1,000/day",
    agents: "16",
    description: "For teams shipping production apps",
    features: [
      "1,000 requests per day",
      "All AI models (+ Opus & GPT-4)",
      "16 concurrent agents",
      "24/7 support",
      "All integrations",
      "Custom deployments"
    ],
    cta: "Subscribe",
    icon: Crown,
    color: "from-purple-500/30 to-pink-500/30",
    borderColor: "border-purple-500/70",
    textColor: "text-purple-400",
    buttonStyle: "bg-purple-600 hover:bg-purple-500 text-white",
    featured: true
  },
  {
    name: "Ultra",
    price: 170,
    requests: "Unlimited",
    agents: "Unlimited",
    description: "For enterprises scaling to millions",
    features: [
      "Unlimited requests",
      "Unlimited AI models",
      "Unlimited agents",
      "Dedicated support",
      "White-label option",
      "API access",
      "Custom training"
    ],
    cta: "Subscribe",
    icon: Infinity,
    color: "from-amber-500/30 to-orange-500/30",
    borderColor: "border-amber-500/70",
    textColor: "text-amber-400",
    buttonStyle: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
  }
];

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (tierName: string) => {
    setUpgrading(true);
    setSelectedTier(tierName);

    try {
      const response = await fetch("/api/aegis/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierName.toUpperCase() })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Successfully upgraded to ${tierName}!`);
      } else {
        alert(`❌ Upgrade failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("❌ Failed to process upgrade");
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <motion.h1
          className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choose Your Power Level
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Simple subscription pricing. No token counting. No surprises.
        </motion.p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, idx) => {
          const Icon = tier.icon;

          return (
            <motion.div
              key={tier.name}
              className={`relative rounded-2xl border ${tier.borderColor} bg-gradient-to-br ${tier.color} backdrop-blur-xl p-8 ${
                tier.featured ? "ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/20" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Featured Badge */}
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tier.color} border ${tier.borderColor} mb-4`}>
                <Icon className={`w-6 h-6 ${tier.textColor}`} />
              </div>

              {/* Name */}
              <h3 className={`text-2xl font-bold ${tier.textColor} mb-2`}>
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">
                  £{tier.price}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>

              {/* Usage Limits */}
              <div className="space-y-2 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Daily Requests</div>
                  <div className="text-xl font-bold text-white">{tier.requests}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Agents</div>
                  <div className="text-xl font-bold text-white">{tier.agents}</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(tier.name)}
                disabled={upgrading && selectedTier === tier.name}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${tier.buttonStyle} ${
                  upgrading && selectedTier === tier.name ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {upgrading && selectedTier === tier.name ? "Processing..." : tier.cta}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto mt-16 text-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <p className="text-gray-400 text-sm">
            💡 <strong className="text-white">No usage anxiety.</strong> All plans have fixed pricing.
            Daily limits reset automatically. Upgrade or downgrade anytime. Need more? Contact us for enterprise pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
