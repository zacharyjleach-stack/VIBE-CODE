'use client';

interface Props {
  snapshots: unknown[];
  position: number;
  onPositionChange: (pos: number) => void;
}

export function MemoryTimeline({ snapshots, position, onPositionChange }: Props) {
  const totalEvents = snapshots.length;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 24px',
      gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)' }}>MEMORY TIMELINE</span>
        <span style={{ fontSize: 9, color: 'rgba(232,232,240,0.5)' }}>
          {position === 100 ? 'LIVE' : `${Math.round((100 - position) * totalEvents / 100)} events ago`}
        </span>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        {/* Timeline track */}
        <div style={{
          width: '100%',
          height: 2,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 1,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${position}%`,
            background: 'linear-gradient(90deg, #7C6AFF, #00D4FF)',
            borderRadius: 1,
            transition: 'width 0.1s',
          }} />

          {/* Event dots */}
          {Array.from({ length: Math.min(totalEvents, 20) }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i / Math.max(totalEvents - 1, 1)) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#7C6AFF',
              boxShadow: '0 0 4px #7C6AFF',
            }} />
          ))}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={e => onPositionChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            opacity: 0,
            cursor: 'pointer',
            height: 24,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(232,232,240,0.3)' }}>
        <span>20 MIN AGO</span>
        <span>NOW</span>
      </div>
    </div>
  );
}
