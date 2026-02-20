'use client';

import Link from 'next/link';

interface Props {
  balance: number;
  maxBalance: number;
  isLifetime: boolean;
  plan: string;
}

export function TokenTank({ balance, maxBalance, isLifetime }: Props) {
  const percentage = isLifetime ? 100 : Math.min(100, (balance / maxBalance) * 100);
  const isLow = percentage < 20;
  const isEmpty = balance <= 0;

  return (
    <div className="card p-6">
      <p className="text-xs text-[var(--text-subtle)] uppercase tracking-widest font-medium mb-4">
        Token Balance
      </p>

      {isLifetime ? (
        <div className="flex items-center gap-3 py-4">
          <span className="text-4xl font-bold text-[var(--accent)]">∞</span>
          <div>
            <p className="text-base font-semibold text-[var(--text)]">Unlimited</p>
            <p className="text-xs text-[var(--text-muted)]">Founder's License</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-bold text-[var(--text)]">{balance.toLocaleString()}</span>
            <span className="text-sm text-[var(--text-muted)]">/ {maxBalance.toLocaleString()}</span>
          </div>

          <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-[var(--accent)]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isEmpty && (
            <p className="text-xs text-red-400">
              Trial exhausted —{' '}
              <Link href="/billing" className="underline">upgrade to continue</Link>
            </p>
          )}
          {isLow && !isEmpty && (
            <p className="text-xs text-orange-400">
              Running low —{' '}
              <Link href="/billing" className="underline">upgrade for unlimited</Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
