'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Network, ScanEye, ShieldCheck, Clock, Monitor, FileCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Network,
    title: 'Relay Bridge',
    description: 'Real-time WebSocket relay keeps every agent on the same context. One change, instantly mirrored everywhere.',
  },
  {
    icon: ScanEye,
    title: 'Vibe Check',
    description: 'Playwright + vision AI screenshots your UI and scores it against your design intent. Know before you ship.',
  },
  {
    icon: ShieldCheck,
    title: 'Logic Guard',
    description: 'Analyses every diff for conflicts before they reach your codebase. No more merge surprises.',
  },
  {
    icon: Clock,
    title: 'Memory Timeline',
    description: 'Scrub back through 20 minutes of agent activity. See exactly what changed, when, and why.',
  },
  {
    icon: Monitor,
    title: 'Desktop HUD',
    description: 'A floating overlay showing live agent status, token balance, and A2A messages without switching windows.',
  },
  {
    icon: FileCheck,
    title: 'Verified Reports',
    description: 'Generate signed "Aegis Verified" build reports. Shareable proof your AI-assisted code was checked.',
  },
];

export function FeaturesGrid() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.features-heading', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.features-heading',
        start: 'top 85%',
      },
    });

    gsap.from('.feature-card', {
      opacity: 0,
      y: 28,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.feature-card',
        start: 'top 88%',
      },
    });
  }, { scope: container });

  return (
    <section ref={container} className="py-32 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <div className="features-heading text-center mb-20">
          <p className="text-sm text-[var(--text-subtle)] tracking-widest uppercase mb-4 font-medium">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text)] mb-4">
            Everything in one relay
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto">
            Built for teams that run multiple AI coding tools and can't afford context drift.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)]">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="feature-card bg-[var(--bg)] p-8 hover:bg-[var(--surface)] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-5 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-dim)] transition-all">
                  <Icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
