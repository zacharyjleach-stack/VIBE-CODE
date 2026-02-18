'use client';

import type { ValidationReport } from '../app/api/reports/route';
import { DiffViewer } from './DiffViewer';

interface Props { report: ValidationReport; }

export function ReportView({ report }: Props) {
  const tweetText = encodeURIComponent(
    `⬡ Just shipped with Aegis AI!\n\nVibe Score: ${report.vibeScore}/100 ✅\n${report.changes.length} changes verified\n\nBuilding with an AI swarm that never loses context 🔥`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header Badge */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,106,255,0.15), rgba(0,212,255,0.1))',
        border: '1px solid rgba(124,106,255,0.3)',
        borderRadius: 16,
        padding: '32px',
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28, color: '#7C6AFF' }}>⬡</span>
            <span style={{ fontSize: 11, letterSpacing: 4, color: 'rgba(232,232,240,0.5)' }}>AEGIS VERIFIED</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#E8E8F0' }}>{report.projectName}</h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(232,232,240,0.6)', fontSize: 13 }}>
            {report.objective}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: report.vibeScore >= 70 ? '#00FF88' : '#FF3B30', lineHeight: 1 }}>
            {report.vibeScore}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,232,240,0.5)', letterSpacing: 1 }}>VIBE SCORE</div>
          <div style={{
            marginTop: 8,
            padding: '4px 12px',
            background: report.passed ? 'rgba(0,255,136,0.15)' : 'rgba(255,59,48,0.15)',
            border: `1px solid ${report.passed ? '#00FF88' : '#FF3B30'}`,
            borderRadius: 20,
            fontSize: 10,
            color: report.passed ? '#00FF88' : '#FF3B30',
            letterSpacing: 2,
            display: 'inline-block',
          }}>
            {report.passed ? '✓ VERIFIED' : '✗ FAILED'}
          </div>
        </div>
      </div>

      {/* Share Button */}
      <div style={{ marginBottom: 32, display: 'flex', gap: 12 }}>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#1DA1F2',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: 'pointer',
            textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          𝕏 Share to X
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#E8E8F0',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: 1,
          }}
        >
          📋 Copy Link
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'CHANGES VERIFIED', value: report.changes.length },
          { label: 'VERIFIED AT', value: new Date(report.createdAt).toLocaleTimeString() },
          { label: 'AEGIS VERSION', value: `v${report.aegisVersion}` },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '16px',
          }}>
            <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(232,232,240,0.4)', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8E8F0' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Screenshot */}
      {report.screenshotUrl && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)', marginBottom: 12 }}>UI SCREENSHOT</div>
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <img src={report.screenshotUrl} alt="UI Screenshot" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      )}

      {/* Changes */}
      {report.changes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(232,232,240,0.5)', marginBottom: 12 }}>VERIFIED CHANGES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.changes.map((change, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 16 }}>✓</span>
                <div>
                  <div style={{ fontSize: 11, color: '#7C6AFF', marginBottom: 2 }}>{change.file}</div>
                  <div style={{ fontSize: 10, color: 'rgba(232,232,240,0.6)' }}>{change.summary}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(232,232,240,0.3)', letterSpacing: 1 }}>
                  {change.agent.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diff */}
      {report.diff && <DiffViewer diff={report.diff} />}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 48, color: 'rgba(232,232,240,0.3)', fontSize: 10, letterSpacing: 2 }}>
        GENERATED BY AEGIS v{report.aegisVersion} · UNIVERSAL AGENTIC BRIDGE
      </div>
    </div>
  );
}
