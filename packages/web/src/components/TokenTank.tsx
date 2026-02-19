'use client';

import { motion } from 'framer-motion';

interface Props {
  balance: number;
  maxBalance: number;
  isLifetime: boolean;
  plan: string;
}

export function TokenTank({ balance, maxBalance, isLifetime, plan }: Props) {
  const percentage = isLifetime ? 100 : Math.min(100, (balance / maxBalance) * 100);
  const isLow = percentage < 20;
  const isEmpty = balance <= 0;

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm tracking-widest text-[var(--text-dim)] mb-4">TOKEN TANK</h3>

      {isLifetime ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">∞</div>
          <div className="text-2xl font-bold text-[var(--accent)]">Unlimited</div>
          <div className="text-sm text-[var(--text-dim)]">Founder's License</div>
        </div>
      ) : (
        <>
          {/* Tank visualization */}
          <div className="relative h-40 bg-[var(--surface)] rounded-xl overflow-hidden mb-4">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`absolute bottom-0 left-0 right-0 ${
                isEmpty ? 'bg-red-500/50' :
                isLow ? 'bg-orange-500/50' :
                'bg-[var(--accent)]/50'
              }`}
              style={{
                boxShadow: isEmpty ? '0 0 30px rgba(255,59,48,0.5)' :
                           isLow ? '0 0 30px rgba(255,149,0,0.5)' :
                           '0 0 30px rgba(124,106,255,0.5)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{balance.toLocaleString()}</div>
                <div className="text-sm text-[var(--text-dim)]">tokens remaining</div>
              </div>
            </div>
          </div>

          {/* Warning */}
          {isLow && !isEmpty && (
            <div className="text-center text-sm text-orange-400">
              ⚠️ Low balance - consider upgrading
            </div>
          )}
          {isEmpty && (
            <div className="text-center text-sm text-red-400">
              ❌ Trial expired - upgrade to continue
            </div>
          )}
        </>
      )}
    </div>
  );
}
