'use client';

interface Props { diff: string; }

export function DiffViewer({ diff }: Props) {
  const lines = diff.split('\n');

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)', marginBottom: 12 }}>CODE DIFF</div>
      <div style={{
        background: '#0D0D0F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'auto',
        maxHeight: 400,
        padding: '16px',
        fontSize: 11,
        lineHeight: 1.6,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            color: line.startsWith('+') ? '#00FF88' :
                   line.startsWith('-') ? '#FF3B30' :
                   line.startsWith('@') ? '#7C6AFF' :
                   'rgba(232,232,240,0.7)',
            background: line.startsWith('+') ? 'rgba(0,255,136,0.05)' :
                        line.startsWith('-') ? 'rgba(255,59,48,0.05)' :
                        'transparent',
            padding: '1px 4px',
            borderRadius: 2,
          }}>
            {line || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}
