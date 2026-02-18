'use client';

interface TokenUsage {
  totalTokens: number;
  totalCost: number;
  sessionTokens: number;
  sessionCost: number;
}

interface Props { usage: TokenUsage; }

export function TokenTracker({ usage }: Props) {
  const budget = 10;
  const percent = Math.min((usage.totalCost / budget) * 100, 100);
  const color = percent < 50 ? '#00FF88' : percent < 80 ? '#FF9500' : '#FF3B30';

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)', marginBottom: 12 }}>API GAS GAUGE</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color }}>${usage.totalCost.toFixed(4)}</span>
        <span style={{ fontSize: 10, color: 'rgba(232,232,240,0.5)', alignSelf: 'flex-end' }}>/ $10 budget</span>
      </div>

      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: `linear-gradient(90deg, #7C6AFF, ${color})`,
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 0.5s ease',
          borderRadius: 3,
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'TOTAL TOKENS', value: `${(usage.totalTokens / 1000).toFixed(1)}K` },
          { label: 'SESSION', value: `$${usage.sessionCost.toFixed(4)}` },
        ].map(item => (
          <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 8, color: 'rgba(232,232,240,0.4)', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#E8E8F0' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
