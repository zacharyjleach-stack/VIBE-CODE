'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, ArrowLeft, Zap, Send, Loader2 } from 'lucide-react';
import { useNeural } from '@/context/NeuralContext';
import { ChatPanel } from '@/components/ChatPanel';
import { SplitPane } from '@/components/SplitPane';
import { useVibeStore } from '@/store/vibeStore';

const ease = [0.16, 1, 0.3, 1] as const;

export default function IrisPage() {
  const router = useRouter();
  const { initiateHandoff, isHandoffPending } = useNeural();
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);

  const sessionId = useVibeStore((s) => s.sessionId);
  const userIntent = useVibeStore((s) => s.userIntent);
  const confidenceScore = useVibeStore((s) => s.confidenceScore);
  const techStack = useVibeStore((s) => s.techStack);
  const initializeSession = useVibeStore((s) => s.initializeSession);
  const getVibeContext = useVibeStore((s) => s.getVibeContext);

  useEffect(() => {
    if (!sessionId) initializeSession();
  }, [sessionId, initializeSession]);

  const isReady = userIntent.length > 10 && confidenceScore >= 0.3;
  const pct = Math.round(confidenceScore * 100);

  const handleBuild = useCallback(() => {
    if (isHandoffLoading || isHandoffPending) return;
    setIsHandoffLoading(true);
    try {
      const ctx = getVibeContext();
      initiateHandoff({
        userIntent: ctx.userIntent,
        techStack: {
          frontend: ctx.techStack.frontend?.name,
          backend: ctx.techStack.backend?.name,
          database: ctx.techStack.database?.name,
        },
        constraints: ctx.constraints.map((c) => c.description),
      });
    } catch {
      setIsHandoffLoading(false);
    }
  }, [getVibeContext, initiateHandoff, isHandoffLoading, isHandoffPending]);

  return (
    <div className="flex h-screen flex-col bg-[#09090b]">
      {/* ── Nav ── */}
      <header className="flex-shrink-0 border-b border-[#1c1c1f] bg-[#09090b]/95 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-5">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="btn-ghost btn p-2"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                <Eye className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-sm font-semibold text-[#fafafa]">Iris</span>
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-[#52525b]">
                  Vision Capture
                </span>
              </div>
            </div>
          </div>

          {/* Centre — confidence + stack */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Confidence bar */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-[#52525b]">Vibe</span>
              <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-[#1c1c1f]">
                <motion.div
                  className="h-full rounded-full bg-violet-500"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease }}
                />
              </div>
              <span
                className={`font-mono text-xs font-medium ${
                  pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-[#52525b]'
                }`}
              >
                {pct}%
              </span>
            </div>

            {/* Stack pills */}
            {(techStack.frontend || techStack.backend) && (
              <div className="flex items-center gap-1.5">
                {techStack.frontend && (
                  <span className="badge badge-active text-[10px]">{techStack.frontend.name}</span>
                )}
                {techStack.backend && (
                  <span className="badge badge-cyan text-[10px]">{techStack.backend.name}</span>
                )}
              </div>
            )}
          </div>

          {/* Right — handoff */}
          <button
            onClick={handleBuild}
            disabled={!isReady || isHandoffLoading || isHandoffPending}
            className={`btn gap-2 ${isReady ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isHandoffLoading || isHandoffPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Send to Aegis
                <Send className="h-3.5 w-3.5 opacity-60" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Hint banner ── */}
      {!isReady && (
        <div className="flex-shrink-0 border-b border-[#1c1c1f] bg-[#111113] px-5 py-2.5">
          <p className="text-center text-xs text-[#52525b]">
            Tell me about your project.{' '}
            Once vibe confidence hits 30 %+ the{' '}
            <span className="text-[#a1a1aa]">Send to Aegis</span>{' '}
            button unlocks.
          </p>
        </div>
      )}

      {/* ── Main ── */}
      <main className="min-h-0 flex-1">
        <SplitPane />
      </main>

      {/* Mobile FAB */}
      {isReady && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <button
            onClick={handleBuild}
            disabled={isHandoffLoading || isHandoffPending}
            className="btn btn-primary h-14 w-14 rounded-full p-0 shadow-lg shadow-violet-600/25"
          >
            {isHandoffLoading || isHandoffPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
