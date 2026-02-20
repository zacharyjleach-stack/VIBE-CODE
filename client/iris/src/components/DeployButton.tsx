'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useVibeStore } from '@/store/vibeStore';
import { aegisApi } from '@/lib/api';

/**
 * DeployButton Component
 * Triggers the handoff from Iris to Aegis
 */
export function DeployButton() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const { userIntent, getVibeContext, setHandoffStatus, setCurrentJobId, setHandoffError, confidenceScore } =
    useVibeStore();

  const isVibeContextValid = () => userIntent.length > 10;

  const handleDeploy = async () => {
    if (!isVibeContextValid()) {
      setDeployError('Please describe what you want to build first');
      return;
    }

    setIsDeploying(true);
    setDeployError(null);
    setHandoffStatus('pending');

    try {
      const vibeContext = getVibeContext();
      const response = await aegisApi.handoff(vibeContext);

      if (response.success && response.data) {
        setCurrentJobId((response.data as any).jobId || null);
        setHandoffStatus('in_progress');
      } else {
        throw new Error(response.error?.message || 'Deployment failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy';
      setDeployError(message);
      setHandoffError(message);
      setHandoffStatus('failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const isDisabled = isDeploying || !isVibeContextValid();

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleDeploy}
        disabled={isDisabled}
        className={`btn w-full justify-center gap-2 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'btn-primary'}`}
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Deploying to Aegis…</span>
          </>
        ) : (
          <>
            <RocketIcon />
            <span>Deploy to Aegis</span>
            {confidenceScore > 0 && (
              <span className="ml-auto text-[10px] opacity-60">{Math.round(confidenceScore * 100)}%</span>
            )}
          </>
        )}
      </button>

      {deployError && (
        <p className="text-[11px] text-red-400 text-center">{deployError}</p>
      )}
    </div>
  );
}

function RocketIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

export default DeployButton;
