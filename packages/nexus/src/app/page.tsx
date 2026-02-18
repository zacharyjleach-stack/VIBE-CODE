'use client';

import { useState, useEffect } from 'react';
import { AgentGraph } from '../components/AgentGraph';
import { MemoryTimeline } from '../components/MemoryTimeline';
import { TokenTracker } from '../components/TokenTracker';
import { ActivityFeed } from '../components/ActivityFeed';
import { useAegisRelay } from '../hooks/useAegisRelay';

export default function NexusPage() {
  const { state, events, tokenUsage, connected } = useAegisRelay();
  const [timelinePos, setTimelinePos] = useState(100);

  return (
    <div className="nexus-layout" style={{
      display: 'grid',
      gridTemplateRows: '56px 1fr 180px',
      gridTemplateColumns: '1fr 340px',
      height: '100vh',
      gap: '1px',
      background: 'var(--border)',
    }}>
      {/* Header */}
      <header style={{
        gridColumn: '1 / -1',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, color: 'var(--accent)' }}>&#x2B21;</span>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, color: 'var(--text)' }}>AEGIS NEXUS</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>COMMAND CENTER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: connected ? 'var(--green)' : '#FF3B30', letterSpacing: 1 }}>
            {connected ? '\u25CF RELAY LIVE' : '\u25CB DISCONNECTED'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{state?.projectName || 'No project'}</span>
        </div>
      </header>

      {/* Main: Agent Graph */}
      <main style={{ background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 4 }}>CURRENT OBJECTIVE</div>
          <div style={{ fontSize: 12, color: 'var(--text)', maxWidth: 400 }}>
            {state?.currentObjective || 'Waiting for Aegis...'}
          </div>
        </div>
        <AgentGraph activeAgents={state?.activeAgents || []} recentChanges={state?.sharedContext?.recentChanges || []} />
      </main>

      {/* Sidebar */}
      <aside style={{
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'hidden',
      }}>
        <TokenTracker usage={tokenUsage} />
        <ActivityFeed events={events} />
      </aside>

      {/* Timeline - bottom full width */}
      <div style={{ gridColumn: '1 / -1', background: 'var(--surface)' }}>
        <MemoryTimeline
          snapshots={events}
          position={timelinePos}
          onPositionChange={setTimelinePos}
        />
      </div>
    </div>
  );
}
