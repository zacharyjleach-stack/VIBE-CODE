'use client';

interface Event {
  type: string;
  agent?: string;
  payload?: { summary?: string; file?: string; message?: string };
  timestamp: string;
}

interface Props { events: Event[]; }

const EVENT_ICONS: Record<string, string> = {
  file_change: '[F]',
  agent_sync: '[S]',
  vibe_check: '[V]',
  logic_guard: '[G]',
  state_update: '[U]',
};

const AGENT_COLORS: Record<string, string> = {
  cursor: '#00FF88',
  claude: '#7C6AFF',
  gemini: '#FF6B35',
  aegis: '#00D4FF',
};

export function ActivityFeed({ events }: Props) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 16px' }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)', marginBottom: 10 }}>LIVE ACTIVITY</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.length === 0 && (
          <div style={{ color: 'rgba(232,232,240,0.3)', fontSize: 10, textAlign: 'center', marginTop: 20 }}>
            No activity yet...
          </div>
        )}
        {[...events].reverse().slice(0, 30).map((event, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
            borderLeft: `2px solid ${AGENT_COLORS[event.agent || 'aegis'] || '#7C6AFF'}`,
          }}>
            <span style={{ fontSize: 11, flex: 'none', color: 'rgba(232,232,240,0.5)' }}>
              {EVENT_ICONS[event.type] || '\u25CF'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: AGENT_COLORS[event.agent || ''] || '#7C6AFF', fontWeight: 700 }}>
                  {event.agent?.toUpperCase() || 'AEGIS'}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(232,232,240,0.3)' }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(232,232,240,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.payload?.summary || event.payload?.file || event.payload?.message || event.type}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
