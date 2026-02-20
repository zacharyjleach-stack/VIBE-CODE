'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HeroSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-badge', { opacity: 0, y: 16, duration: 0.6 })
      .from('.hero-headline', { opacity: 0, y: 24, duration: 0.7 }, '-=0.3')
      .from('.hero-sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
      .from('.hero-cta', { opacity: 0, y: 16, duration: 0.5 }, '-=0.3')
      .from('.hero-stats > *', { opacity: 0, y: 12, stagger: 0.1, duration: 0.5 }, '-=0.2')
      .from('.hero-viz', { opacity: 0, y: 32, duration: 0.8, ease: 'power2.out' }, '-=0.5');
  }, { scope: container });

  return (
    <section ref={container} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Very subtle radial gradient at center — not a blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 badge mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
          Public Beta — Free to start
        </div>

        {/* Headline */}
        <h1 className="hero-headline text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-[var(--text)]">
          One bridge for
          <br />
          <span className="text-gradient">every AI agent.</span>
        </h1>

        {/* Subheadline */}
        <p className="hero-sub text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Aegis keeps Cursor, Claude Code, and Gemini in sync.
          Shared context. No conflicts. One source of truth.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link href="/sign-up" className="btn-primary">
            Download Aegis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#demo" className="btn-secondary">
            <Play className="w-3.5 h-3.5 fill-current" />
            Watch demo
          </Link>
        </div>

        {/* Stats */}
        <div className="hero-stats flex items-center justify-center gap-8 md:gap-16 mb-20 text-center">
          {[
            { value: '5,000', label: 'Free tokens' },
            { value: '3', label: 'AI agents unified' },
            { value: '0', label: 'Context conflicts' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
              <div className="text-sm text-[var(--text-subtle)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Product visualization — clean terminal/bridge diagram */}
        <div className="hero-viz max-w-3xl mx-auto">
          <div className="card p-1 rounded-2xl overflow-hidden">
            {/* Terminal header bar */}
            <div className="bg-[#0D0D0F] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="text-xs text-[var(--text-subtle)] ml-2 font-mono">aegis relay — ws://localhost:7734</span>
              </div>

              {/* Agent bridge visualization */}
              <div className="px-6 py-8">
                <div className="flex items-center justify-between gap-4">
                  {/* Agent node */}
                  {[
                    { name: 'Cursor', color: '#6366F1', status: 'synced' },
                    { name: 'Aegis', color: '#FAFAFA', status: 'bridge', center: true },
                    { name: 'Claude', color: '#6366F1', status: 'synced' },
                  ].map((agent, i) => (
                    <div key={agent.name} className="flex flex-col items-center gap-3 flex-1">
                      <div
                        className={`rounded-xl flex items-center justify-center font-bold text-sm transition ${
                          agent.center ? 'w-14 h-14 text-base' : 'w-12 h-12'
                        }`}
                        style={{
                          background: agent.center
                            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                            : 'rgba(99,102,241,0.1)',
                          border: agent.center ? 'none' : '1px solid rgba(99,102,241,0.2)',
                          color: agent.center ? '#fff' : agent.color,
                        }}
                      >
                        {agent.center ? '⬡' : agent.name.slice(0, 2)}
                      </div>
                      <span className="text-xs font-medium text-[var(--text-muted)]">{agent.name}</span>
                      <span className="text-[10px] text-[var(--success)] font-mono">● {agent.status}</span>

                      {/* Connector lines (between items) */}
                      {i < 2 && (
                        <div className="absolute" style={{ display: 'none' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Live log lines */}
                <div className="mt-6 space-y-1.5 font-mono text-xs text-left border-t border-[var(--border-subtle)] pt-4">
                  {[
                    { time: '09:41:02', msg: 'context.sync  → broadcast to 2 agents', dim: false },
                    { time: '09:41:02', msg: 'cursor        ← received 847 tokens', dim: true },
                    { time: '09:41:03', msg: 'claude        ← received 847 tokens', dim: true },
                    { time: '09:41:05', msg: 'logic.guard   ✓ no conflicts detected', dim: false },
                  ].map((line, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-[var(--text-subtle)] shrink-0">{line.time}</span>
                      <span className={line.dim ? 'text-[var(--text-subtle)]' : 'text-[var(--text-muted)]'}>
                        {line.msg}
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <span className="text-[var(--text-subtle)] shrink-0">09:41:06</span>
                    <span className="text-[var(--text-muted)]">
                      aegis <span className="text-[var(--success)]">ready</span>
                      <span className="inline-block w-1.5 h-3.5 bg-[var(--text-muted)] ml-1 animate-pulse align-middle" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
