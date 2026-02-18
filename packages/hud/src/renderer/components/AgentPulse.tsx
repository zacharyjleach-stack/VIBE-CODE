import type { AgentState } from '../App';

const AGENT_COLORS = {
  cursor: { primary: '#00FF88', glow: 'rgba(0, 255, 136, 0.4)', label: 'CURSOR' },
  claude: { primary: '#7C6AFF', glow: 'rgba(124, 106, 255, 0.4)', label: 'CLAUDE' },
  gemini: { primary: '#FF6B35', glow: 'rgba(255, 107, 53, 0.4)', label: 'GEMINI' },
};

const STATUS_LABELS = {
  idle: 'STANDBY',
  thinking: 'THINKING',
  writing: 'WRITING',
  error: 'ERROR',
};

interface Props { agent: AgentState; }

export function AgentPulse({ agent }: Props) {
  const colors = AGENT_COLORS[agent.type];
  const isActive = agent.status !== 'idle';

  return (
    <div className="agent-pulse" style={{ '--agent-color': colors.primary, '--agent-glow': colors.glow } as React.CSSProperties}>
      <div className={`pulse-ring ${isActive ? 'pulsing' : ''}`} />
      <div className="pulse-core" />
      <div className="agent-info">
        <span className="agent-name">{colors.label}</span>
        <span className={`agent-status status-${agent.status}`}>
          {STATUS_LABELS[agent.status]}
        </span>
      </div>
    </div>
  );
}
