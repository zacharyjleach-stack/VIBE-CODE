'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🔗',
    title: 'Relay Bridge',
    description: 'Real-time context sync between Cursor, Claude, and Gemini. Every change is instantly whispered to all agents.',
    color: 'var(--accent)',
  },
  {
    icon: '👁️',
    title: 'Vibe Check',
    description: 'Playwright + GPT-4o Vision verifies your UI matches the vibe. Screenshots, scores, and suggestions.',
    color: 'var(--accent-cyan)',
  },
  {
    icon: '🛡️',
    title: 'Logic Guard',
    description: 'AI analyzes diffs for conflicts before they happen. No more "wait, who changed that?"',
    color: 'var(--accent-green)',
  },
  {
    icon: '📊',
    title: 'Memory Timeline',
    description: 'Scrub back through 20 minutes of project history. See exactly what each agent did.',
    color: 'var(--accent-orange)',
  },
  {
    icon: '🖥️',
    title: 'Desktop HUD',
    description: 'A semi-transparent overlay that shows agent status, A2A chat, and token usage in real-time.',
    color: 'var(--accent)',
  },
  {
    icon: '📄',
    title: 'Verified Reports',
    description: 'Shareable "Aegis Verified" build reports. Flex your AI-assisted code on X.',
    color: 'var(--accent-cyan)',
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-[var(--text-dim)]">
            One platform to rule all your AI coding agents
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:bg-white/5 transition group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
