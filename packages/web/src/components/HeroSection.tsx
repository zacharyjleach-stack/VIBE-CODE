'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[150px] opacity-20 animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-cyan)] rounded-full blur-[150px] opacity-20 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8"
        >
          <span className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse" />
          <span className="text-xs tracking-widest text-[var(--text-dim)]">NOW IN PUBLIC BETA</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold leading-tight mb-6"
        >
          The Ghost in
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-cyan)] to-[var(--accent-green)] bg-clip-text text-transparent">
            Your Machine
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-[var(--text-dim)] max-w-2xl mx-auto mb-10"
        >
          Synchronize <span className="text-[var(--accent)]">Cursor</span>,{' '}
          <span className="text-[var(--accent-cyan)]">Claude Code</span>, and{' '}
          <span className="text-[var(--accent-orange)]">Gemini</span> into one AI team.
          <br />
          Never lose context. Never hallucinate conflicts.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/sign-up"
            className="px-8 py-4 bg-[var(--accent)] rounded-xl text-lg font-bold hover:opacity-90 transition glow-purple"
          >
            Download Aegis — Free
          </Link>
          <Link
            href="#demo"
            className="px-8 py-4 glass rounded-xl text-lg font-semibold hover:bg-white/5 transition"
          >
            Watch Demo ▶
          </Link>
        </motion.div>

        {/* Agent visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="glass rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-12">
              {/* Claude */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-cyan)]/20 border-2 border-[var(--accent-cyan)] flex items-center justify-center animate-float">
                  <span className="text-2xl">🤖</span>
                </div>
                <span className="text-xs tracking-widest text-[var(--accent-cyan)]">CLAUDE</span>
              </div>

              {/* Aegis center */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[var(--accent)]/20 border-2 border-[var(--accent)] flex items-center justify-center glow-purple">
                  <span className="text-3xl text-[var(--accent)]">⬡</span>
                </div>
                <span className="text-xs tracking-widest text-[var(--accent)]">AEGIS</span>
              </div>

              {/* Cursor */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/20 border-2 border-[var(--accent-green)] flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-2xl">⌨️</span>
                </div>
                <span className="text-xs tracking-widest text-[var(--accent-green)]">CURSOR</span>
              </div>
            </div>

            {/* Connection lines */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: '5,000', label: 'Free tokens to start' },
            { value: '3', label: 'AI agents unified' },
            { value: '0', label: 'Context conflicts' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-[var(--text-dim)] mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
