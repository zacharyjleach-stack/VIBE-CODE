'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNeural, type VibePayload } from '@/context/NeuralContext';
import { useVibeStore } from '@/store/vibeStore';
import { VisualizationPanel } from '@/components';

// ==================== Types ====================

interface WorkerSlot {
  id: number;
  status: 'idle' | 'initializing' | 'active' | 'complete' | 'error';
  task: string;
  progress: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

// ==================== Aegis Command Center Content ====================

function AegisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPendingHandoff, acknowledgeHandoff } = useNeural();
  const {
    userIntent,
    setUserIntent,
    techStack,
    updateTechStack,
    constraints,
    agents,
    updateAgentStatus,
    resetAgents,
    handoffStatus,
    setHandoffStatus,
  } = useVibeStore();

  // Local state
  const [missionBrief, setMissionBrief] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [swarmPhase, setSwarmPhase] = useState<'standby' | 'initializing' | 'deploying' | 'active' | 'complete'>('standby');
  const [receivedVibe, setReceivedVibe] = useState<VibePayload | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualIntent, setManualIntent] = useState('');

  // Worker slots for the grid
  const [workers, setWorkers] = useState<WorkerSlot[]>(
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      status: 'idle',
      task: 'Awaiting orders',
      progress: 0,
    }))
  );

  // ==================== Notification System ====================

  const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // ==================== Swarm Initialization ====================

  const initializeSwarm = useCallback(async () => {
    setSwarmPhase('initializing');
    setIsSwarmActive(true);
    setHandoffStatus('in_progress');

    // Simulate worker initialization with staggered start
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setWorkers(prev => prev.map((w, idx) =>
        idx === i ? { ...w, status: 'initializing', task: 'Booting up...', progress: 0 } : w
      ));
    }

    setSwarmPhase('deploying');
    showNotification('Swarm initialized. Deploying workers...', 'info');

    // Activate workers sequentially
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const tasks = [
        'Analyzing requirements',
        'Scaffolding project',
        'Setting up database',
        'Creating API routes',
        'Building components',
        'Styling interface',
        'Writing tests',
        'Documentation',
        'Security audit',
        'Performance optimization',
        'Integration testing',
        'Code review',
        'Final validation',
        'Deployment prep',
        'Asset optimization',
        'Launch verification',
      ];
      setWorkers(prev => prev.map((w, idx) =>
        idx === i ? { ...w, status: 'active', task: tasks[i], progress: 10 } : w
      ));
    }

    setSwarmPhase('active');
    showNotification('All 16 workers deployed and active!', 'success');
  }, [setHandoffStatus, showNotification]);

  // ==================== Auto-Receive Mode ====================

  useEffect(() => {
    const mode = searchParams.get('mode');

    if (mode === 'auto_receive' && hasPendingHandoff()) {
      const vibe = acknowledgeHandoff();

      if (vibe) {
        // Populate mission and state from received vibe
        setReceivedVibe(vibe);
        setUserIntent(vibe.userIntent);
        setMissionBrief(vibe.userIntent);

        // Update tech stack if provided
        if (vibe.techStack) {
          if (vibe.techStack.frontend) {
            updateTechStack({ frontend: { name: vibe.techStack.frontend } });
          }
          if (vibe.techStack.backend) {
            updateTechStack({ backend: { name: vibe.techStack.backend } });
          }
          if (vibe.techStack.database) {
            updateTechStack({ database: { type: 'other', name: vibe.techStack.database } });
          }
        }

        showNotification('Mission received from Iris!', 'success');

        // Auto-start swarm initialization after a brief delay
        setTimeout(() => {
          initializeSwarm();
        }, 1000);
      }
    } else if (mode !== 'auto_receive') {
      setManualMode(true);
    }
  }, [searchParams, hasPendingHandoff, acknowledgeHandoff, setUserIntent, updateTechStack, showNotification, initializeSwarm]);

  // ==================== Worker Progress Simulation ====================

  useEffect(() => {
    if (swarmPhase !== 'active') return;

    const interval = setInterval(() => {
      setWorkers(prev => {
        const updated = prev.map(worker => {
          if (worker.status === 'active' && worker.progress < 100) {
            const increment = Math.floor(Math.random() * 5) + 1;
            const newProgress = Math.min(worker.progress + increment, 100);
            return {
              ...worker,
              progress: newProgress,
              status: newProgress >= 100 ? 'complete' as const : 'active' as const,
            };
          }
          return worker;
        });

        // Check if all workers are complete
        const allComplete = updated.every(w => w.status === 'complete');
        if (allComplete) {
          setSwarmPhase('complete');
          setHandoffStatus('completed');
          showNotification('Mission complete! All workers have finished their tasks.', 'success');
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [swarmPhase, setHandoffStatus, showNotification]);

  // ==================== Control Functions ====================

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
    setWorkers(prev => prev.map(w => ({
      ...w,
      status: 'idle',
      task: 'Awaiting orders',
      progress: 0,
    })));
    showNotification('Swarm operations halted.', 'warning');
  }, [setHandoffStatus, resetAgents, showNotification]);

  const handleReset = useCallback(() => {
    handleStop();
    setMissionBrief('');
    setManualIntent('');
    setReceivedVibe(null);
    showNotification('System reset complete.', 'info');
  }, [handleStop, showNotification]);

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Notification Stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`
              px-4 py-3 rounded-lg border backdrop-blur-xl shadow-lg
              animate-slide-in-right
              ${notif.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : ''}
              ${notif.type === 'info' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : ''}
              ${notif.type === 'warning' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : ''}
              ${notif.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {notif.type === 'success' && <CheckIcon className="w-5 h-5" />}
              {notif.type === 'info' && <InfoIcon className="w-5 h-5" />}
              {notif.type === 'warning' && <WarningIcon className="w-5 h-5" />}
              {notif.type === 'error' && <ErrorIcon className="w-5 h-5" />}
              <span className="font-medium">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Return to Iris</span>
            </button>

            {/* Aegis Branding */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <ShieldIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  AEGIS
                </h1>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                  Swarm Command Center
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`
                w-3 h-3 rounded-full
                ${swarmPhase === 'standby' ? 'bg-slate-500' : ''}
                ${swarmPhase === 'initializing' ? 'bg-amber-500 animate-pulse' : ''}
                ${swarmPhase === 'deploying' ? 'bg-cyan-500 animate-pulse' : ''}
                ${swarmPhase === 'active' ? 'bg-emerald-500 animate-pulse' : ''}
                ${swarmPhase === 'complete' ? 'bg-emerald-500' : ''}
              `} />
              <span className="text-sm font-mono text-slate-300 uppercase">
                {swarmPhase}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Mission Brief & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mission Brief Card */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <DocumentIcon className="w-4 h-4 text-cyan-400" />
                  Mission Brief
                </h2>
              </div>
              <div className="p-4">
                {receivedVibe ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono text-emerald-400 uppercase">
                          Received from Iris
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 font-mono leading-relaxed">
                        {missionBrief || 'No mission details received.'}
                      </p>
                    </div>

                    {receivedVibe.techStack && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-mono text-slate-400 uppercase">Tech Stack</h3>
                        <div className="flex flex-wrap gap-2">
                          {receivedVibe.techStack.frontend && (
                            <span className="px-2 py-1 text-xs font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {receivedVibe.techStack.frontend}
                            </span>
                          )}
                          {receivedVibe.techStack.backend && (
                            <span className="px-2 py-1 text-xs font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {receivedVibe.techStack.backend}
                            </span>
                          )}
                          {receivedVibe.techStack.database && (
                            <span className="px-2 py-1 text-xs font-mono rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {receivedVibe.techStack.database}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : manualMode ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      No auto-receive detected. Enter mission parameters manually:
                    </p>
                    <textarea
                      value={manualIntent}
                      onChange={(e) => setManualIntent(e.target.value)}
                      placeholder="Describe your mission objectives..."
                      className="w-full h-32 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-200 text-sm font-mono placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ControlIcon className="w-4 h-4 text-cyan-400" />
                  Control Panel
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handleStart}
                  disabled={isSwarmActive || (!missionBrief && !manualIntent.trim())}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all
                    bg-gradient-to-r from-cyan-500 to-emerald-500 text-white
                    hover:from-cyan-400 hover:to-emerald-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  <div className="flex items-center justify-center gap-2">
                    <PlayIcon className="w-5 h-5" />
                    <span>Deploy Swarm</span>
                  </div>
                </button>

                <button
                  onClick={handleStop}
                  disabled={!isSwarmActive}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all
                    bg-red-500/20 text-red-400 border border-red-500/30
                    hover:bg-red-500/30
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <StopIcon className="w-5 h-5" />
                    <span>Halt Operations</span>
                  </div>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all
                    bg-slate-700/50 text-slate-300 border border-slate-600
                    hover:bg-slate-700"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ResetIcon className="w-5 h-5" />
                    <span>Reset System</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Mission Stats */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-slate-200">Mission Statistics</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-900/50">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">
                    {workers.filter(w => w.status === 'active').length}
                  </div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Active</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-900/50">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {workers.filter(w => w.status === 'complete').length}
                  </div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Complete</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-900/50">
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {workers.filter(w => w.status === 'initializing').length}
                  </div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Init</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-900/50">
                  <div className="text-2xl font-bold text-slate-400 font-mono">
                    {workers.filter(w => w.status === 'idle').length}
                  </div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Standby</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Swarm Grid */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl overflow-hidden h-full">
              <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <SwarmIcon className="w-4 h-4 text-cyan-400" />
                    Swarm Status Grid
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    16 Worker Slots
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {workers.map((worker) => (
                    <WorkerCard key={worker.id} worker={worker} />
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <LegendItem color="bg-slate-500" label="Standby" />
                    <LegendItem color="bg-amber-500" label="Initializing" />
                    <LegendItem color="bg-cyan-500" label="Active" />
                    <LegendItem color="bg-emerald-500" label="Complete" />
                    <LegendItem color="bg-red-500" label="Error" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Panel Section */}
        <div className="mt-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-cyan-400" />
                System Visualization
              </h2>
            </div>
            <div className="h-[400px]">
              <VisualizationPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==================== Worker Card Component ====================

interface WorkerCardProps {
  worker: WorkerSlot;
}

function WorkerCard({ worker }: WorkerCardProps) {
  const statusColors: Record<WorkerSlot['status'], string> = {
    idle: 'border-slate-600 bg-slate-800/30',
    initializing: 'border-amber-500/50 bg-amber-500/10',
    active: 'border-cyan-500/50 bg-cyan-500/10',
    complete: 'border-emerald-500/50 bg-emerald-500/10',
    error: 'border-red-500/50 bg-red-500/10',
  };

  const statusDotColors: Record<WorkerSlot['status'], string> = {
    idle: 'bg-slate-500',
    initializing: 'bg-amber-500 animate-pulse',
    active: 'bg-cyan-500 animate-pulse',
    complete: 'bg-emerald-500',
    error: 'bg-red-500',
  };

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all duration-300
        ${statusColors[worker.status]}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[worker.status]}`} />
          <span className="text-xs font-mono font-bold text-slate-300">
            W-{String(worker.id).padStart(2, '0')}
          </span>
        </div>
        {worker.status !== 'idle' && worker.status !== 'complete' && (
          <span className="text-xs font-mono text-slate-400">
            {worker.progress}%
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 truncate font-mono">
        {worker.task}
      </p>
      {worker.status === 'active' && (
        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${worker.progress}%` }}
          />
        </div>
      )}
      {worker.status === 'complete' && (
        <div className="mt-2 flex items-center gap-1 text-emerald-400">
          <CheckIcon className="w-3 h-3" />
          <span className="text-xs font-mono">Done</span>
        </div>
      )}
    </div>
  );
}

// ==================== Legend Item ====================

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs text-slate-400 font-mono">{label}</span>
    </div>
  );
}

// ==================== Icons ====================

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function DocumentIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ControlIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

function SwarmIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ChartIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function PlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StopIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function ResetIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function InfoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ErrorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ==================== Main Page Component ====================

export default function AegisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-500 flex items-center justify-center animate-pulse">
            <ShieldIcon className="w-10 h-10 text-white" />
          </div>
          <p className="text-slate-400 font-mono text-sm">Initializing Aegis...</p>
        </div>
      </div>
    }>
      <AegisContent />
    </Suspense>
  );
}
