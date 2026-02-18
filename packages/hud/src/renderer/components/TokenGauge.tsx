interface Props { total: number; cost: number; }

export function TokenGauge({ total, cost }: Props) {
  const MAX_TOKENS = 1_000_000;
  const percent = Math.min((total / MAX_TOKENS) * 100, 100);
  const color = percent < 50 ? '#00FF88' : percent < 80 ? '#FF9500' : '#FF3B30';

  return (
    <div className="section">
      <div className="section-label">API GAS GAUGE</div>
      <div className="gauge-container">
        <div className="gauge-bar">
          <div
            className="gauge-fill"
            style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
        </div>
        <div className="gauge-stats">
          <span>{(total / 1000).toFixed(1)}K tokens</span>
          <span style={{ color }}>${cost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
