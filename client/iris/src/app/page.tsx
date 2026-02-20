'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

/* ─────────────────────────── helpers ─────────────────────────── */

const ease = [0.16, 1, 0.3, 1] as const; // custom expo ease

/* Subtle animated radial gradient that drifts on hover */
function RadialDrift({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      animate={{
        opacity: isActive ? 1 : 0.4,
        scale: isActive ? 1.08 : 1,
      }}
      transition={{ duration: 0.8, ease }}
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

/* Vertical dot-grid lines that flow in one direction */
function ScanLines({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      animate={{ opacity: visible ? 0.25 : 0.08 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255,255,255,0.04) 47px, rgba(255,255,255,0.04) 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255,255,255,0.04) 47px, rgba(255,255,255,0.04) 48px)',
        }}
      />
    </motion.div>
  );
}

/* Center orb — clean, purposeful */
function CenterOrb({ leftActive, rightActive }: { leftActive: boolean; rightActive: boolean }) {
  const color = leftActive
    ? '139, 92, 246'
    : rightActive
    ? '6, 182, 212'
    : '99, 102, 241';

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      {/* Outer pulse rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid rgba(${color}, 0.2)` }}
          animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Orb body */}
      <motion.div
        className="relative h-12 w-12 rounded-full"
        animate={{ scale: leftActive || rightActive ? 1.15 : 1 }}
        transition={{ duration: 0.5, ease }}
        style={{
          background: `conic-gradient(from 180deg, rgba(${color}, 0.9), rgba(${color}, 0.3), rgba(${color}, 0.9))`,
          boxShadow: `0 0 24px rgba(${color}, 0.5), inset 0 0 12px rgba(255,255,255,0.15)`,
        }}
      >
        {/* Inner gloss */}
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────── main ─────────────────────────── */

const PANEL_DATA = {
  iris: {
    label: 'IRIS',
    tagline: 'Think it.',
    description: 'Describe your vision. Iris captures intent, suggests tech stacks, and distills your ideas into an executable brief.',
    accent: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
    color: '#c4b5fd',
    dimColor: 'rgba(139, 92, 246, 0.06)',
    href: '/iris',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="14" y1="2" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="22" x2="14" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  aegis: {
    label: 'AEGIS',
    tagline: 'Build it.',
    description: 'A 16-slot agent swarm receives the brief and executes. It scaffolds, codes, tests, reviews, and deploys — all in parallel.',
    accent: 'rgba(6, 182, 212, 0.10)',
    border: 'rgba(6, 182, 212, 0.22)',
    color: '#67e8f9',
    dimColor: 'rgba(6, 182, 212, 0.05)',
    href: '/aegis',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L3 8.5V15.5C3 20.3 8 24.5 14 26C20 24.5 25 20.3 25 15.5V8.5L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 14l3.5 3.5 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
} as const;

type Side = 'iris' | 'aegis' | null;

export default function SplitGateLanding() {
  const router = useRouter();
  const [hovered, setHovered] = useState<Side>(null);

  const go = useCallback((href: string) => router.push(href), [router]);

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[#09090b]">
      {/* Top branding */}
      <motion.div
        className="absolute left-1/2 top-8 z-50 -translate-x-1/2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.2 }}
      >
        <p className="text-center text-[10px] font-medium tracking-[0.25em] text-[#52525b] uppercase">
          Vibe Code Platform
        </p>
      </motion.div>

      {/* Version badge */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 rounded-full border border-[#27272a] bg-[#111113] px-3 py-1.5">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          <span className="text-[10px] font-mono text-[#52525b]">v1.0 · All systems operational</span>
        </div>
      </motion.div>

      {/* ── Iris (left) ── */}
      {(['iris', 'aegis'] as const).map((side, i) => {
        const d = PANEL_DATA[side];
        const isHovered = hovered === side;
        const isDimmed = hovered !== null && hovered !== side;

        return (
          <motion.div
            key={side}
            className="relative h-full cursor-pointer overflow-hidden"
            initial={{ width: '50%', opacity: 0 }}
            animate={{
              width: isHovered ? '57%' : isDimmed ? '43%' : '50%',
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 32, opacity: { duration: 0.6, delay: i * 0.05 } }}
            onMouseEnter={() => setHovered(side)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => go(d.href)}
          >
            {/* Base dark bg */}
            <div className="absolute inset-0 bg-[#09090b]" />

            {/* Grid */}
            <ScanLines visible={isHovered} />

            {/* Radial gradient accent */}
            <RadialDrift color={d.accent.replace('0.12', '0.2').replace('0.10', '0.18')} isActive={isHovered} />

            {/* Top edge glow */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 top-0 h-px"
              animate={{ opacity: isHovered ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              style={{
                background: `linear-gradient(90deg, transparent, ${d.color}60, transparent)`,
              }}
            />

            {/* Dim overlay when other side is hovered */}
            <AnimatePresence>
              {isDimmed && (
                <motion.div
                  className="absolute inset-0 z-20 bg-[#09090b]/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            {/* ── Content ── */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-12">
              {/* Icon */}
              <motion.div
                className="mb-8"
                style={{ color: d.color }}
                animate={{ scale: isHovered ? 1.08 : 1, opacity: isHovered ? 1 : 0.7 }}
                transition={{ duration: 0.4, ease }}
              >
                {d.icon}
              </motion.div>

              {/* Label */}
              <motion.h1
                className="mb-3 font-bold leading-none tracking-tight"
                animate={{
                  fontSize: isHovered ? '88px' : '72px',
                  color: isHovered ? d.color : '#fafafa',
                }}
                transition={{ duration: 0.4, ease }}
              >
                {d.label}
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="mb-6 text-2xl font-light"
                animate={{
                  opacity: isHovered ? 1 : 0.45,
                  color: isHovered ? d.color : '#71717a',
                }}
                transition={{ duration: 0.3 }}
              >
                {d.tagline}
              </motion.p>

              {/* Separator */}
              <motion.div
                className="mb-6 h-px"
                animate={{
                  width: isHovered ? 120 : 64,
                  opacity: isHovered ? 1 : 0.3,
                }}
                transition={{ duration: 0.4, ease }}
                style={{
                  background: `linear-gradient(90deg, transparent, ${d.color}, transparent)`,
                }}
              />

              {/* Description — only on hover */}
              <AnimatePresence mode="wait">
                {isHovered && (
                  <motion.p
                    key="desc"
                    className="max-w-[280px] text-center text-sm leading-relaxed text-[#a1a1aa]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    {d.description}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Enter hint */}
              <motion.div
                className="absolute bottom-14 flex items-center gap-2"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xs tracking-wider text-[#71717a]" style={{ color: isHovered ? d.color : '#71717a' }}>
                  Enter
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: d.color }}>
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {/* ── Center divider ── */}
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-40 w-px -translate-x-1/2"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease, delay: 0.1 }}
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            rgba(99,102,241,0.15) 15%,
            rgba(99,102,241,0.35) 50%,
            rgba(99,102,241,0.15) 85%,
            transparent 100%
          )`,
          transformOrigin: 'top',
        }}
      />

      {/* ── Center orb ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease, delay: 0.4 }}
      >
        <CenterOrb leftActive={hovered === 'iris'} rightActive={hovered === 'aegis'} />
      </motion.div>
    </div>
  );
}
