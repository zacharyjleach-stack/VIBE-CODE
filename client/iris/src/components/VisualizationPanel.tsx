'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useVibeStore } from '@/store/vibeStore';
import { useAegisConnection } from '@/hooks/useAegisConnection';
import { IntegrationsPanel } from './IntegrationsPanel';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8b5cf6',
    primaryTextColor: '#fafafa',
    primaryBorderColor: '#6d28d9',
    lineColor: '#3f3f46',
    secondaryColor: '#18181b',
    tertiaryColor: '#09090b',
    background: '#09090b',
    mainBkg: '#18181b',
    nodeBorder: '#3f3f46',
    clusterBkg: '#111113',
    titleColor: '#fafafa',
    edgeLabelBackground: '#18181b',
  },
  flowchart: { htmlLabels: true, curve: 'basis' },
});

type ViewMode = 'architecture' | 'agents' | 'preview' | 'integrations';

export function VisualizationPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('agents');
  const { agents, currentJobId, handoffStatus } = useVibeStore();
  const { swarmState } = useAegisConnection();

  const tabs: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'agents', label: 'Swarm', icon: <SwarmIcon /> },
    { id: 'architecture', label: 'Architecture', icon: <DiagramIcon /> },
    { id: 'preview', label: 'Preview', icon: <PreviewIcon /> },
    { id: 'integrations', label: 'Integrations', icon: <IntegrationsIcon /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-[#27272a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
              viewMode === tab.id
                ? 'text-[#8b5cf6] border-[#8b5cf6]'
                : 'text-[#52525b] border-transparent hover:text-[#a1a1aa]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'agents' && (
          <AgentSwarmView
            agents={swarmState?.agents || agents}
            missionId={currentJobId}
            status={handoffStatus}
          />
        )}
        {viewMode === 'architecture' && <ArchitectureView />}
        {viewMode === 'preview' && <ComponentPreview />}
        {viewMode === 'integrations' && <IntegrationsPanel />}
      </div>
    </div>
  );
}

interface AgentSwarmViewProps {
  agents: Array<{ id: string; name: string; status: string; currentTask?: string; progress: number }>;
  missionId: string | null;
  status: string;
}

function AgentSwarmView({ agents, missionId, status }: AgentSwarmViewProps) {
  const slots = Array.from({ length: 16 }, (_, i) => {
    const agent = agents[i];
    return agent || { id: `slot-${i}`, name: `Worker ${i + 1}`, status: 'Idle', progress: 0 };
  });

  return (
    <div className="space-y-4">
      {/* Mission header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#27272a] bg-[#18181b]">
        <div>
          <p className="text-xs font-medium text-[#a1a1aa]">
            {missionId ? `Mission ${missionId.slice(0, 8)}…` : 'No active mission'}
          </p>
          <p className="text-[10px] text-[#52525b] mt-0.5">16 worker slots</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Worker grid */}
      <div className="grid grid-cols-4 gap-2">
        {slots.map((agent, index) => (
          <WorkerSlotCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-[#27272a]">
        <LegendItem color="bg-[#3f3f46]" label="Idle" />
        <LegendItem color="bg-blue-500" label="Initializing" />
        <LegendItem color="bg-[#8b5cf6]" label="Coding" />
        <LegendItem color="bg-amber-500" label="Testing" />
        <LegendItem color="bg-emerald-500" label="Complete" />
        <LegendItem color="bg-red-500" label="Error" />
      </div>
    </div>
  );
}

// Normalize status values from both the Zustand store (lowercase) and the
// Aegis backend (PascalCase) into the PascalCase keys used by style maps.
function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    idle: 'Idle', working: 'Coding', success: 'Complete',
    error: 'Error', waiting: 'Idle',
  };
  return map[status] ?? status; // PascalCase values pass through unchanged
}

function WorkerSlotCard({ agent, index }: { agent: { id: string | number; name?: string; status: string; currentTask?: string; progress?: number }; index: number }) {
  const status = normalizeStatus(agent.status);

  const cardStyles: Record<string, string> = {
    Idle: 'border-[#27272a] bg-[#18181b]',
    Initializing: 'border-blue-500/30 bg-blue-500/5',
    Coding: 'border-[#8b5cf6]/30 bg-[#8b5cf6]/5',
    Testing: 'border-amber-500/30 bg-amber-500/5',
    Reviewing: 'border-purple-500/30 bg-purple-500/5',
    Complete: 'border-emerald-500/30 bg-emerald-500/5',
    Error: 'border-red-500/30 bg-red-500/5',
  };

  const dotStyles: Record<string, string> = {
    Idle: 'bg-[#3f3f46]',
    Initializing: 'bg-blue-500 animate-pulse',
    Coding: 'bg-[#8b5cf6] animate-pulse',
    Testing: 'bg-amber-500 animate-pulse',
    Reviewing: 'bg-purple-500 animate-pulse',
    Complete: 'bg-emerald-500',
    Error: 'bg-red-500',
  };

  const barStyles: Record<string, string> = {
    Idle: 'bg-[#3f3f46]',
    Initializing: 'bg-blue-500',
    Coding: 'bg-[#8b5cf6]',
    Testing: 'bg-amber-500',
    Reviewing: 'bg-purple-500',
    Complete: 'bg-emerald-500',
    Error: 'bg-red-500',
  };

  const progress = agent.progress ?? 0;

  return (
    <div className={`p-2 rounded-lg border transition-colors ${cardStyles[status] || cardStyles.Idle}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || dotStyles.Idle}`} />
        <span className="text-[10px] font-semibold text-[#71717a]">#{index + 1}</span>
      </div>
      <p className="text-[10px] text-[#52525b] truncate leading-tight">
        {agent.currentTask || status}
      </p>
      {progress > 0 && status !== 'Complete' && (
        <div className="mt-1.5 h-0.5 bg-[#27272a] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${barStyles[status] || barStyles.Idle}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: 'bg-[#27272a] text-[#71717a]',
    deploying: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    active: 'bg-[#8b5cf6]/10 text-[#a78bfa] border border-[#8b5cf6]/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[status] || styles.idle}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-[#52525b]">{label}</span>
    </div>
  );
}

function ArchitectureView() {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const { userIntent } = useVibeStore();

  const diagram = `
flowchart TB
    subgraph Iris["Iris Frontend"]
        UI[Chat Interface]
        VC[Vibe Capture]
        VIZ[Visualization]
    end

    subgraph Aegis["Aegis Engine"]
        SM[Swarm Manager]
        MO[Mission Orchestrator]
        subgraph Workers["Worker Pool"]
            W1[Worker 1]
            W2[Worker 2]
            W3[Worker ...]
            W16[Worker 16]
        end
    end

    subgraph Output["Generated Output"]
        CODE[Source Code]
        TESTS[Test Suite]
        DOCS[Documentation]
    end

    UI --> VC
    VC -->|vibe_context| SM
    SM --> MO
    MO --> Workers
    Workers --> CODE
    Workers --> TESTS
    Workers --> DOCS
    VIZ -.->|WebSocket| SM
  `;

  useEffect(() => {
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = diagram;
      mermaid.run({ nodes: [mermaidRef.current] });
    }
  }, [diagram]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-[#27272a] bg-[#18181b]">
        <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest mb-3">System Architecture</h3>
        <div ref={mermaidRef} className="mermaid flex justify-center" />
      </div>
      {userIntent && (
        <div className="p-4 rounded-lg border border-[#27272a] bg-[#18181b]">
          <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest mb-2">Current Intent</h3>
          <p className="text-sm text-[#71717a] leading-relaxed">{userIntent}</p>
        </div>
      )}
    </div>
  );
}

function ComponentPreview() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl border border-[#27272a] bg-[#18181b] flex items-center justify-center">
          <PreviewIcon className="w-6 h-6 text-[#3f3f46]" />
        </div>
        <p className="text-sm font-medium text-[#52525b]">Component Preview</p>
        <p className="text-xs text-[#3f3f46] mt-1 max-w-[200px] mx-auto">
          Live previews appear once agents begin generating code
        </p>
      </div>
    </div>
  );
}

function SwarmIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DiagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function PreviewIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IntegrationsIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default VisualizationPanel;
