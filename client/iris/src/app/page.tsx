'use client';

import { useEffect } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { useAegisConnection } from '@/hooks/useAegisConnection';
import { useVibeStore } from '@/store/vibeStore';

export default function Home() {
  const { isConnected, error } = useAegisConnection();
  const { sessionId, initializeSession } = useVibeStore();

  useEffect(() => {
    // Initialize a new session when the app loads
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId, initializeSession]);

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      {/* Connection status overlay */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Main split pane interface */}
      <SplitPane />
    </div>
  );
}
