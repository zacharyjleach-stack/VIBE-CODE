'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeural, type VibePayload } from '@/context/NeuralContext';
import { useVibeStore } from '@/store/vibeStore';
import { VisualizationPanel } from '@/components';
import {
  ArrowLeft, Shield, Play, Square, RotateCcw,
  FileText, SlidersHorizontal, LayoutGrid, BarChart2,
  CheckCircle2, AlertCircle, Loader2, Clock,
} from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */

type WorkerStatus = 'idle' | 'initializing' | 'active' | 'complete' | 'error';
type SwarmPhase = 'standby' | 'initializing' | 'deploying' | 'active' | 'complete';

interface WorkerSlot {
  id: number;
  status: WorkerStatus;
  task: string;
  progress: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────── worker card ─────────────────────────── */

const WORKER_TASKS = [
  'Analysing requirements', 'Scaffolding project', 'Setting up DB',
  'Creating API routes', 'Building components', 'Styling interface',
  'Writing tests', 'Documentation', 'Security audit',
  'Performance tuning', 'Integration tests', 'Code review',
  'Final validation', 'Deployment prep', 'Asset optimisation', 'Launch check',
];

const STATUS_STYLES: Record<WorkerStatus, string> = {
  idle:         'agent-idle',
  initializing: 'agent-initializing',
  active:       'agent-active',
  complete:     'agent-complete',
  error:        'agent-error',
};

const STATUS_DOT: Record<WorkerStatus, string> = {
  idle:         'bg-[#27272a]',
  initializing: 'bg-amber-500',
  active:       'bg-cyan-500',
  complete:     'bg-green-500',
  error:        'bg-red-500',
};

function WorkerCard({ worker }: { worker: WorkerSlot }) {
  return (
    <motion.div
      layout
      className={STATUS_STYLES[worker.status]}
      animate={{ opacity: worker.status === 'idle' ? 0.5 : 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header row */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${STATUS_DOT[worker.status]} ${
              worker.status === 'active' || worker.status === 'initializing' ? 'animate-pulse' : ''
            }`}
          />
          <span className="font-mono text-[10px] font-semibold text-[#71717a]">
            W-{String(worker.id).padStart(2, '0')}
          </span>
        </div>
        {worker.status === 'active' && (
          <span className="font-mono text-[10px] text-[#52525b]">{worker.progress}%</span>
        )}
        {worker.status === 'complete' && (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        )}
        {worker.status === 'error' && (
          <AlertCircle className="h-3 w-3 text-red-400" />
        )}
      </div>

      {/* Task */}
      <p className="w-full truncate text-center font-mono text-[9px] text-[#52525b] leading-tight">
        {worker.task}
      </p>

      {/* Progress bar */}
      {worker.status === 'active' && (
        <div className="w-full">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-[#1c1c1f]">
            <motion.div
              className="h-full rounded-full bg-cyan-500"
              animate={{ width: `${worker.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────── phase badge ─────────────────────────── */

const PHASE_CONFIG: Record<SwarmPhase, { label: string; color: string; pulse: boolean }> = {
  standby:      { label: 'Standby',      color: 'text-[#52525b]',   pulse: false },
  initializing: { label: 'Initializing', color: 'text-amber-400',   pulse: true },
  deploying:    { label: 'Deploying',    color: 'text-cyan-400',    pulse: true },
  active:       { label: 'Active',       color: 'text-green-400',   pulse: true },
  complete:     { label: 'Complete',     color: 'text-green-400',   pulse: false },
};

function PhaseBadge({ phase }: { phase: SwarmPhase }) {
  const cfg = PHASE_CONFIG[phase];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[
        phase === 'standby' ? 'idle' :
        phase === 'complete' ? 'complete' :
        phase === 'active' ? 'active' :
        'initializing'
      ]} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      <span className={`font-mono text-xs font-medium uppercase ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

/* ─────────────────────────── stats card ─────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        className={`text-3xl font-bold font-mono ${color}`}
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {value}
      </motion.div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#52525b]">{label}</div>
    </div>
  );
}

/* ─────────────────────────── toast ─────────────────────────── */

function ToastStack({ toasts }: { toasts: Toast[] }) {
  const TYPE_STYLES: Record<Toast['type'], string> = {
    success: 'border-green-500/20 bg-green-500/10 text-green-300',
    info:    'border-cyan-500/20  bg-cyan-500/10  text-cyan-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    error:   'border-red-500/20   bg-red-500/10   text-red-300',
  };

  return (
    <div className="fixed right-5 top-20 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease }}
            className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${TYPE_STYLES[t.type]}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── main content ─────────────────────────── */

function AegisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPendingHandoff, acknowledgeHandoff } = useNeural();
  const { userIntent, setUserIntent, updateTechStack, resetAgents, setHandoffStatus } = useVibeStore();

  const [missionBrief, setMissionBrief] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [swarmPhase, setSwarmPhase] = useState<SwarmPhase>('standby');
  const [receivedVibe, setReceivedVibe] = useState<VibePayload | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualIntent, setManualIntent] = useState('');
  const [workers, setWorkers] = useState<WorkerSlot[]>(
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1, status: 'idle', task: 'Awaiting orders', progress: 0,
    }))
  );

  /* ── toasts ── */
  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `t-${Date.now()}`;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  /* ── swarm init ── */
  const initializeSwarm = useCallback(async () => {
    setSwarmPhase('initializing');
    setIsSwarmActive(true);
    setHandoffStatus('in_progress');

    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setWorkers((p) =>
        p.map((w, idx) => idx === i ? { ...w, status: 'initializing', task: 'Booting…', progress: 0 } : w)
      );
    }

    setSwarmPhase('deploying');
    toast('Swarm initialised — deploying workers…', 'info');

    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 160));
      setWorkers((p) =>
        p.map((w, idx) => idx === i ? { ...w, status: 'active', task: WORKER_TASKS[i], progress: 5 } : w)
      );
    }

    setSwarmPhase('active');
    toast('All 16 workers active and coding!', 'success');
  }, [setHandoffStatus, toast]);

  /* ── auto-receive ── */
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'auto_receive' && hasPendingHandoff()) {
      const vibe = acknowledgeHandoff();
      if (vibe) {
        setReceivedVibe(vibe);
        setUserIntent(vibe.userIntent);
        setMissionBrief(vibe.userIntent);
        if (vibe.techStack?.frontend) updateTechStack({ frontend: { name: vibe.techStack.frontend } });
        if (vibe.techStack?.backend) updateTechStack({ backend: { name: vibe.techStack.backend } });
        toast('Mission received from Iris!', 'success');
        setTimeout(() => initializeSwarm(), 800);
      }
    } else if (mode !== 'auto_receive') {
      setManualMode(true);
    }
  }, [searchParams, hasPendingHandoff, acknowledgeHandoff, setUserIntent, updateTechStack, toast, initializeSwarm]);

  /* ── progress simulation ── */
  useEffect(() => {
    if (swarmPhase !== 'active') return;
    const id = setInterval(() => {
      setWorkers((prev) => {
        const updated = prev.map((w) => {
          if (w.status !== 'active' || w.progress >= 100) return w;
          const next = Math.min(w.progress + Math.floor(Math.random() * 4) + 1, 100);
          return { ...w, progress: next, status: next >= 100 ? 'complete' as const : 'active' as const };
        });
        const allDone = updated.every((w) => w.status === 'complete');
        if (allDone) {
          setSwarmPhase('complete');
          setHandoffStatus('completed');
          toast('Mission complete! All workers finished.', 'success');
        }
        return updated;
      });
    }, 400);
    return () => clearInterval(id);
  }, [swarmPhase, setHandoffStatus, toast]);

  /* ── controls ── */
  const handleStart = useCallback(() => {
    if (manualMode && manualIntent.trim()) {
      setUserIntent(manualIntent);
      setMissionBrief(manualIntent);
    }
    initializeSwarm();
  }, [manualMode, manualIntent, setUserIntent, initializeSwarm]);

  const handleStop = useCallback(() => {
    setIsSwarmActive(false);
    setSwarmPhase('standby');
    setHandoffStatus('idle');
    resetAgents();
    setWorkers((p) => p.map((w) => ({ ...w, status: 'idle', task: 'Awaiting orders', progress: 0 })));
    toast('Swarm halted.', 'warning');
  }, [setHandoffStatus, resetAgents, toast]);

  const handleReset = useCallback(() => {
    handleStop();
    setMissionBrief('');
    setManualIntent('');
    setReceivedVibe(null);
    toast('System reset.', 'info');
  }, [handleStop, toast]);

  /* ─── stats ─── */
  const stats = {
    active:   workers.filter((w) => w.status === 'active').length,
    complete: workers.filter((w) => w.status === 'complete').length,
    init:     workers.filter((w) => w.status === 'initializing').length,
    idle:     workers.filter((w) => w.status === 'idle').length,
  };
  const overallProgress = Math.round(
    workers.reduce((acc, w) => acc + w.progress, 0) / 16
  );

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      <ToastStack toasts={toasts} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-[#1c1c1f] bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => router.push('/')}
            className="btn-ghost btn gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Iris
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Shield className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-semibold text-sm text-[#fafafa]">Aegis</span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-[#52525b]">
                Swarm Command
              </span>
            </div>
          </div>

          <PhaseBadge phase={swarmPhase} />
        </div>
      </header>

      {/* ── Layout ── */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">

          {/* ── Left sidebar ── */}
          <div className="flex flex-col gap-4">

            {/* Mission Brief */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#1c1c1f] px-4 py-3">
                <FileText className="h-3.5 w-3.5 text-[#52525b]" />
                <span className="text-xs font-medium text-[#a1a1aa]">Mission Brief</span>
              </div>
              <div className="p-4">
                {receivedVibe ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-green-500/15 bg-green-500/5 p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="font-mono text-[10px] uppercase text-green-400">From Iris</span>
                      </div>
                      <p className="font-mono text-xs leading-relaxed text-[#a1a1aa]">
                        {missionBrief || 'No details.'}
                      </p>
                    </div>
                    {receivedVibe.techStack && (
                      <div className="flex flex-wrap gap-1.5">
                        {[receivedVibe.techStack.frontend, receivedVibe.techStack.backend, receivedVibe.techStack.database]
                          .filter(Boolean)
                          .map((v) => (
                            <span key={v} className="badge badge-cyan font-mono text-[10px]">{v}</span>
                          ))}
                      </div>
                    )}
                  </div>
                ) : manualMode ? (
                  <textarea
                    value={manualIntent}
                    onChange={(e) => setManualIntent(e.target.value)}
                    placeholder="Describe your mission…"
                    className="input h-28 resize-none text-xs font-mono"
                  />
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[#52525b]" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#1c1c1f] px-4 py-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#52525b]" />
                <span className="text-xs font-medium text-[#a1a1aa]">Control Panel</span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <button
                  onClick={handleStart}
                  disabled={isSwarmActive || (!missionBrief && !manualIntent.trim())}
                  className="btn btn-primary w-full justify-center"
                >
                  <Play className="h-4 w-4" />
                  Deploy Swarm
                </button>
                <button onClick={handleStop} disabled={!isSwarmActive} className="btn btn-danger w-full justify-center">
                  <Square className="h-4 w-4" />
                  Halt Operations
                </button>
                <button onClick={handleReset} className="btn btn-secondary w-full justify-center">
                  <RotateCcw className="h-4 w-4" />
                  Reset System
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#1c1c1f] px-4 py-3">
                <BarChart2 className="h-3.5 w-3.5 text-[#52525b]" />
                <span className="text-xs font-medium text-[#a1a1aa]">Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                <StatCard label="Active"   value={stats.active}   color="text-cyan-400" />
                <StatCard label="Complete" value={stats.complete} color="text-green-400" />
                <StatCard label="Init"     value={stats.init}     color="text-amber-400" />
                <StatCard label="Idle"     value={stats.idle}     color="text-[#52525b]" />
              </div>

              {/* Overall progress bar */}
              {isSwarmActive && (
                <div className="border-t border-[#1c1c1f] px-4 pb-4 pt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-[#52525b]">Overall progress</span>
                    <span className="font-mono text-[10px] text-[#71717a]">{overallProgress}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#1c1c1f]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-500"
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Swarm grid ── */}
          <div className="flex flex-col gap-4">
            <div className="card flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#1c1c1f] px-4 py-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5 text-[#52525b]" />
                  <span className="text-xs font-medium text-[#a1a1aa]">Swarm Grid</span>
                </div>
                <span className="font-mono text-[10px] text-[#3f3f46]">16 SLOTS</span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
                  {workers.map((w) => (
                    <WorkerCard key={w.id} worker={w} />
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1c1c1f] pt-4">
                  {[
                    { label: 'Standby',      color: 'bg-[#27272a]' },
                    { label: 'Initializing', color: 'bg-amber-500' },
                    { label: 'Active',       color: 'bg-cyan-500' },
                    { label: 'Complete',     color: 'bg-green-500' },
                    { label: 'Error',        color: 'bg-red-500' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${l.color}`} />
                      <span className="font-mono text-[10px] text-[#52525b]">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visualisation */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#1c1c1f] px-4 py-3">
                <Clock className="h-3.5 w-3.5 text-[#52525b]" />
                <span className="text-xs font-medium text-[#a1a1aa]">System Visualisation</span>
              </div>
              <div className="h-[360px]">
                <VisualizationPanel />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────── page export ─────────────────────────── */

export default function AegisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
              <Shield className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-xs text-[#52525b]">Initialising Aegis…</p>
          </div>
        </div>
      }
    >
      <AegisContent />
    </Suspense>
  );
}
