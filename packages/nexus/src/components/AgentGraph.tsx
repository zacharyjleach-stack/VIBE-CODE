'use client';

import { useCallback, useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, BackgroundVariant, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface RecentChange {
  file: string;
  agent: string;
  summary: string;
  timestamp: string;
}

interface Props {
  activeAgents: string[];
  recentChanges: RecentChange[];
}

const AGENT_CONFIG = {
  cursor: { color: '#00FF88', label: 'CURSOR', icon: '\u25C8', x: 150, y: 200 },
  claude: { color: '#7C6AFF', label: 'CLAUDE CODE', icon: '\u25C7', x: 450, y: 80 },
  gemini: { color: '#FF6B35', label: 'GEMINI', icon: '\u25C6', x: 450, y: 320 },
  aegis:  { color: '#00D4FF', label: 'AEGIS', icon: '\u2B21', x: 300, y: 200 },
};

function AgentNode({ data }: { data: { label: string; color: string; icon: string; active: boolean } }) {
  return (
    <div style={{
      width: 100,
      height: 100,
      borderRadius: '50%',
      border: `2px solid ${data.color}`,
      background: `radial-gradient(circle, ${data.color}22 0%, transparent 70%)`,
      boxShadow: data.active ? `0 0 30px ${data.color}66, 0 0 60px ${data.color}22` : `0 0 10px ${data.color}33`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'default',
      transition: 'all 0.5s ease',
      animation: data.active ? 'glow-pulse 2s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: 24, color: data.color }}>{data.icon}</span>
      <span style={{ fontSize: 9, color: data.color, letterSpacing: 1, marginTop: 4 }}>{data.label}</span>
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

export function AgentGraph({ activeAgents, recentChanges }: Props) {
  const initialNodes: Node[] = useMemo(() => Object.entries(AGENT_CONFIG).map(([id, cfg]) => ({
    id,
    type: 'agentNode',
    position: { x: cfg.x, y: cfg.y },
    data: {
      label: cfg.label,
      color: cfg.color,
      icon: cfg.icon,
      active: activeAgents.includes(id),
    },
    draggable: true,
    style: { width: 100, height: 100 },
  })), [activeAgents]);

  const initialEdges: Edge[] = [
    { id: 'aegis-cursor', source: 'aegis', target: 'cursor', animated: true, style: { stroke: '#00FF88', strokeWidth: 2, strokeDasharray: '5,5' } },
    { id: 'aegis-claude', source: 'aegis', target: 'claude', animated: true, style: { stroke: '#7C6AFF', strokeWidth: 2, strokeDasharray: '5,5' } },
    { id: 'aegis-gemini', source: 'aegis', target: 'gemini', animated: true, style: { stroke: '#FF6B35', strokeWidth: 2, strokeDasharray: '5,5' } },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params: Parameters<typeof addEdge>[0]) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.04)" gap={24} />
      </ReactFlow>

      {/* Recent activity overlay */}
      {recentChanges.slice(0, 3).map((change, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: 20 + i * 44,
          left: 20,
          background: 'rgba(13,13,15,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 10,
          color: 'rgba(232,232,240,0.7)',
          backdropFilter: 'blur(10px)',
          maxWidth: 300,
        }}>
          <span style={{ color: '#7C6AFF' }}>[{change.agent}]</span> {change.summary}
        </div>
      ))}
    </div>
  );
}
