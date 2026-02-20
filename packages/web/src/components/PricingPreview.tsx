'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Pro',
    price: '$20',
    period: '/month',
    description: 'For developers who need full power.',
    cta: 'Get started',
    href: '/billing',
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
    name: "Founder's License",
    price: '$550',
    period: 'one-time',
    description: 'Everything Pro, forever. No subscription.',
    cta: 'Get lifetime access',
    href: '/billing?plan=lifetime',
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

export function PricingPreview() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.pricing-heading', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pricing-heading',
        start: 'top 85%',
      },
    });

    gsap.from('.pricing-card', {
      opacity: 0,
      y: 32,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pricing-card',
        start: 'top 85%',
      },
    });
  }, { scope: container });

  return (
    <section ref={container} className="py-32 px-6 border-t border-[var(--border)]">
      <div className="max-w-4xl mx-auto">
        <div className="pricing-heading text-center mb-16">
          <p className="text-sm text-[var(--text-subtle)] tracking-widest uppercase mb-4 font-medium">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text)] mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-[var(--text-muted)]">
            Start with 5,000 free tokens. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative rounded-2xl p-8 ${
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
                <p className={`text-sm font-medium mb-3 ${plan.featured ? 'text-[var(--text-subtle)]' : 'text-[var(--text-muted)]'}`}>
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
                    <Check className={`w-4 h-4 shrink-0 ${plan.featured ? 'text-[var(--bg)]' : 'text-[var(--success)]'}`} />
                    <span className={plan.featured ? 'text-[#333]' : 'text-[var(--text-muted)]'}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-3 text-center rounded-xl text-sm font-semibold transition ${
                  plan.featured
                    ? 'bg-[var(--bg)] text-[var(--text)] hover:bg-[#111]'
                    : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] hover:border-[#3F3F46]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[var(--text-subtle)] mt-8">
          Free tier includes 5,000 tokens. No card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
