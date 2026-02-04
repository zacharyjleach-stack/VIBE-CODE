'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useVibeStore } from '@/store/vibeStore';
import { useAegisConnection } from '@/hooks/useAegisConnection';

// Initialize Mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

type ViewMode = 'architecture' | 'agents' | 'preview';

/**
 * VisualizationPanel Component
 * Right side of the split pane showing:
 * - Architecture diagrams (Mermaid.js)
 * - Agent swarm status
 * - Component preview
 */
export function VisualizationPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('agents');
  const { agentStatuses, missionId, deploymentStatus } = useVibeStore();
  const { swarmState } = useAegisConnection();

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Tabs */}
      <div className="flex border-b border-dark-800 bg-dark-900/50">
        <TabButton
          active={viewMode === 'agents'}
          onClick={() => setViewMode('agents')}
          label="Agent Swarm"
          icon={<SwarmIcon />}
        />
        <TabButton
          active={viewMode === 'architecture'}
          onClick={() => setViewMode('architecture')}
          label="Architecture"
          icon={<DiagramIcon />}
        />
        <TabButton
          active={viewMode === 'preview'}
          onClick={() => setViewMode('preview')}
          label="Preview"
          icon={<PreviewIcon />}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'agents' && (
          <AgentSwarmView
            agents={swarmState?.agents || agentStatuses}
            missionId={missionId}
            status={deploymentStatus}
          />
        )}
        {viewMode === 'architecture' && <ArchitectureView />}
        {viewMode === 'preview' && <ComponentPreview />}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function TabButton({ active, onClick, label, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
        ${active
          ? 'text-iris-400 border-b-2 border-iris-400 bg-dark-800/50'
          : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/30'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

interface AgentSwarmViewProps {
  agents: Array<{
    id: string;
    name: string;
    status: string;
    currentTask?: string;
    progress: number;
  }>;
  missionId: string | null;
  status: string;
}

function AgentSwarmView({ agents, missionId, status }: AgentSwarmViewProps) {
  // Create 16 worker slots (filled or empty)
  const slots = Array.from({ length: 16 }, (_, i) => {
    const agent = agents[i];
    return agent || { id: `slot-${i}`, name: `Worker ${i + 1}`, status: 'Idle', progress: 0 };
  });

  return (
    <div className="space-y-4">
      {/* Mission Status Header */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700">
        <div>
          <h3 className="text-sm font-medium text-dark-200">Mission Status</h3>
          <p className="text-xs text-dark-400">
            {missionId ? `Mission: ${missionId.slice(0, 8)}...` : 'No active mission'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Worker Grid */}
      <div className="grid grid-cols-4 gap-2">
        {slots.map((agent, index) => (
          <WorkerSlotCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-dark-800">
        <LegendItem color="bg-dark-600" label="Idle" />
        <LegendItem color="bg-blue-500" label="Initializing" />
        <LegendItem color="bg-iris-500" label="Coding" />
        <LegendItem color="bg-amber-500" label="Testing" />
        <LegendItem color="bg-green-500" label="Complete" />
        <LegendItem color="bg-red-500" label="Error" />
      </div>
    </div>
  );
}

interface WorkerSlotCardProps {
  agent: {
    id: string;
    name: string;
    status: string;
    currentTask?: string;
    progress: number;
  };
  index: number;
}

function WorkerSlotCard({ agent, index }: WorkerSlotCardProps) {
  const statusColors: Record<string, string> = {
    Idle: 'border-dark-600 bg-dark-800/30',
    Initializing: 'border-blue-500/50 bg-blue-500/10',
    Coding: 'border-iris-500/50 bg-iris-500/10',
    Testing: 'border-amber-500/50 bg-amber-500/10',
    Reviewing: 'border-purple-500/50 bg-purple-500/10',
    Complete: 'border-green-500/50 bg-green-500/10',
    Error: 'border-red-500/50 bg-red-500/10',
  };

  const statusDotColors: Record<string, string> = {
    Idle: 'bg-dark-500',
    Initializing: 'bg-blue-500 animate-pulse',
    Coding: 'bg-iris-500 animate-pulse',
    Testing: 'bg-amber-500 animate-pulse',
    Reviewing: 'bg-purple-500 animate-pulse',
    Complete: 'bg-green-500',
    Error: 'bg-red-500',
  };

  return (
    <div
      className={`
        p-2 rounded-lg border transition-all duration-300
        ${statusColors[agent.status] || statusColors.Idle}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${statusDotColors[agent.status] || statusDotColors.Idle}`} />
        <span className="text-xs font-medium text-dark-300">#{index + 1}</span>
      </div>
      <p className="text-[10px] text-dark-400 truncate">
        {agent.currentTask || agent.status}
      </p>
      {agent.progress > 0 && agent.status !== 'Complete' && (
        <div className="mt-1 h-1 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-iris-500 transition-all duration-300"
            style={{ width: `${agent.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: 'bg-dark-700 text-dark-300',
    deploying: 'bg-blue-500/20 text-blue-400 animate-pulse',
    active: 'bg-iris-500/20 text-iris-400',
    completed: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.idle}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded ${color}`} />
      <span className="text-xs text-dark-400">{label}</span>
    </div>
  );
}

function ArchitectureView() {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const { vibeContext } = useVibeStore();

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
      <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
        <h3 className="text-sm font-medium text-dark-200 mb-3">System Architecture</h3>
        <div
          ref={mermaidRef}
          className="mermaid flex justify-center"
        />
      </div>

      {vibeContext.user_intent && (
        <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
          <h3 className="text-sm font-medium text-dark-200 mb-2">Current Intent</h3>
          <p className="text-sm text-dark-400">{vibeContext.user_intent}</p>
        </div>
      )}
    </div>
  );
}

function ComponentPreview() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <PreviewIcon className="w-8 h-8 text-dark-500" />
        </div>
        <h3 className="text-lg font-medium text-dark-300 mb-2">Component Preview</h3>
        <p className="text-sm text-dark-500 max-w-xs">
          Live component previews will appear here once agents begin generating code.
        </p>
      </div>
    </div>
  );
}

// Icons
function SwarmIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function DiagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function PreviewIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default VisualizationPanel;
