'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function PricingPreview() {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] rounded-full blur-[200px] opacity-10" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-xl text-[var(--text-dim)]">
            Start free. Upgrade when you need more power.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pro Monthly */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8"
          >
            <div className="text-sm tracking-widest text-[var(--text-dim)] mb-2">PRO</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold">$20</span>
              <span className="text-[var(--text-dim)]">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited context syncs',
                '500 Vibe Checks/month',
                'Desktop HUD access',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--accent-green)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/billing"
              className="block w-full py-3 text-center glass rounded-xl font-semibold hover:bg-white/5 transition"
            >
              Subscribe →
            </Link>
          </motion.div>

          {/* Lifetime */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border-[var(--accent)] glow-purple relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--accent)] rounded-full text-xs font-bold">
              BEST VALUE
            </div>
            <div className="text-sm tracking-widest text-[var(--accent)] mb-2">FOUNDER'S LICENSE</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold">$550</span>
              <span className="text-[var(--text-dim)]">one-time</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Pro, forever',
                'Unlimited Vibe Checks',
                'Early access to new features',
                'Founder Discord channel',
                'Your name in the credits',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--accent)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/billing?plan=lifetime"
              className="block w-full py-3 text-center bg-[var(--accent)] rounded-xl font-bold hover:opacity-90 transition"
            >
              Get Lifetime Access →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
