Build a complete pricing page with monthly/annual toggle and Stripe checkout.

What to build: $ARGUMENTS

**Pricing page with toggle:**
```tsx
'use client';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['5,000 tokens', 'Basic sync', '1 project'],
    cta: 'Get Started',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 20,
    annualPrice: 160,
    features: ['Unlimited tokens', 'All agents', 'Priority support', 'HUD + Nexus'],
    cta: 'Start Pro',
    priceId: { monthly: 'price_xxx', annual: 'price_yyy' },
    highlighted: true,
  },
  {
    name: 'Lifetime',
    monthlyPrice: 550,
    annualPrice: 550,
    features: ['Everything forever', 'Founder Discord', 'Name in credits', 'All future features'],
    cta: 'Get Lifetime',
    priceId: { monthly: 'price_zzz', annual: 'price_zzz' },
    highlighted: false,
  },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-3 justify-center mb-12">
        <span>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-12 h-6 rounded-full transition ${annual ? 'bg-[#7C6AFF]' : 'bg-white/20'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? 'left-7' : 'left-1'}`} />
        </button>
        <span>Annual <span className="text-[#00FF88] text-sm font-bold">Save 33%</span></span>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {PLANS.map(plan => (
          <PlanCard key={plan.name} plan={plan} annual={annual} />
        ))}
      </div>

      {/* FAQ */}
      <PricingFAQ />
    </div>
  );
}
```

**Checkout flow:**
- Click CTA → POST /api/checkout with priceId
- Redirect to Stripe checkout
- Success → /dashboard?success=true
- Show confetti animation on success

**Features to include:**
- Highlighted recommended plan with glow effect
- Feature comparison table below cards
- FAQ accordion section
- Money-back guarantee badge
- "Most Popular" badge
- Savings calculator (annual vs monthly)

Build the full pricing page with all animations and Stripe integration.
