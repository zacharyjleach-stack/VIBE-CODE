import { useState, useEffect, useRef } from 'react';
import { AgentPulse } from './components/AgentPulse';
import { A2AChat } from './components/A2AChat';
import { StatePanel } from './components/StatePanel';
import { TokenGauge } from './components/TokenGauge';

export interface AgentState {
  type: 'cursor' | 'claude' | 'gemini';
  status: 'idle' | 'thinking' | 'writing' | 'error';
  lastMessage?: string;
}

export interface ChatMessage {
  from: string;
  to?: string;
  text: string;
  timestamp: string;
}

export interface RelayEvent {
  type: string;
  agent?: string;
  payload?: {
    message?: string;
    file?: string;
    summary?: string;
    analysis?: { summary?: string };
    state?: { currentObjective?: string; sharedContext?: { recentChanges?: unknown[] } };
    tokenUsage?: { total?: number; cost?: number };
  };
  timestamp: string;
}

const RELAY_URL = 'ws://localhost:7734';

export default function App() {
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    cursor: { type: 'cursor', status: 'idle' },
    claude: { type: 'claude', status: 'idle' },
    gemini: { type: 'gemini', status: 'idle' },
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [objective, setObjective] = useState('Waiting for Aegis...');
  const [tokenUsage, setTokenUsage] = useState({ total: 0, cost: 0 });
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket(RELAY_URL);

      ws.current.onopen = () => {
        setConnected(true);
        console.log('Connected to Aegis Relay');
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: RelayEvent = JSON.parse(event.data);
          handleRelayEvent(msg);
        } catch { /* ignore */ }
      };

      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
    }

    connect();
    return () => ws.current?.close();
  }, []);

  function handleRelayEvent(event: RelayEvent) {
    const agent = event.agent || 'unknown';

    if (event.type === 'state_update' && event.payload?.state) {
      const state = event.payload.state;
      if (state.currentObjective) setObjective(state.currentObjective);
      if (state.sharedContext?.recentChanges) {
        setAgents(prev => ({
          ...prev,
          [agent]: { ...prev[agent], status: 'writing' } as AgentState,
        }));
        setTimeout(() => {
          setAgents(prev => ({
            ...prev,
            [agent]: { ...prev[agent], status: 'idle' } as AgentState,
          }));
        }, 3000);
      }
    }

    if (event.type === 'agent_sync') {
      const text = event.payload?.summary || event.payload?.message || 'Syncing...';
      setMessages(prev => [...prev.slice(-19), {
        from: agent,
        text,
        timestamp: event.timestamp,
      }]);

      setAgents(prev => ({
        ...prev,
        [agent]: { ...prev[agent], status: 'thinking' } as AgentState,
      }));
    }

    if (event.type === 'vibe_check') {
      setMessages(prev => [...prev.slice(-19), {
        from: 'aegis',
        text: `Vibe check complete: ${event.payload?.summary || 'done'}`,
        timestamp: event.timestamp,
      }]);
    }

    if (event.payload?.tokenUsage) {
      setTokenUsage(event.payload.tokenUsage as { total: number; cost: number });
    }
  }

  return (
    <div className="hud-root">
      {/* Header */}
      <div className="hud-header">
        <div className="hud-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">AEGIS</span>
        </div>
        <div className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
      </div>

      {/* Agent Pulses */}
      <div className="section">
        <div className="section-label">ACTIVE AGENTS</div>
        <div className="agents-grid">
          {Object.values(agents).map(agent => (
            <AgentPulse key={agent.type} agent={agent} />
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="section">
        <div className="section-label">CURRENT OBJECTIVE</div>
        <div className="objective-text">{objective}</div>
      </div>

      {/* Token Gauge */}
      <TokenGauge total={tokenUsage.total} cost={tokenUsage.cost} />

      {/* A2A Chat */}
      <div className="section flex-grow">
        <div className="section-label">A2A CHANNEL</div>
        <A2AChat messages={messages} />
      </div>

      {/* State Panel */}
      <StatePanel connected={connected} />
    </div>
  );
}
