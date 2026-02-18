interface Props { connected: boolean; }

export function StatePanel({ connected }: Props) {
  return (
    <div className="state-panel">
      <span className={`relay-status ${connected ? 'online' : 'offline'}`}>
        {connected ? '⬡ RELAY ONLINE' : '○ RELAY OFFLINE'}
      </span>
      <span className="relay-port">:7734</span>
    </div>
  );
}
