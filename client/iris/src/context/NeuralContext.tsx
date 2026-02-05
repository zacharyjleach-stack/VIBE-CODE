'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface VibePayload {
  userIntent: string;
  techStack?: {
    frontend?: string;
    backend?: string;
    database?: string;
  };
  constraints?: string[];
  timestamp: number;
  sourceAI: 'iris' | 'aegis';
}

interface NeuralState {
  activeVibe: VibePayload | null;
  isHandoffPending: boolean;
  handoffHistory: VibePayload[];
}

interface NeuralContextType extends NeuralState {
  // Iris can "dream" a vibe
  setActiveVibe: (vibe: Omit<VibePayload, 'timestamp' | 'sourceAI'>) => void;

  // Trigger handoff from Iris to Aegis
  initiateHandoff: (vibe?: Omit<VibePayload, 'timestamp' | 'sourceAI'>) => void;

  // Aegis acknowledges receipt
  acknowledgeHandoff: () => VibePayload | null;

  // Clear the active vibe
  clearVibe: () => void;

  // Check if there's a pending handoff
  hasPendingHandoff: () => boolean;
}

// Create context with default values
const NeuralContext = createContext<NeuralContextType | null>(null);

// Provider component
export function NeuralProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<NeuralState>({
    activeVibe: null,
    isHandoffPending: false,
    handoffHistory: [],
  });

  const setActiveVibe = useCallback((vibe: Omit<VibePayload, 'timestamp' | 'sourceAI'>) => {
    const fullVibe: VibePayload = {
      ...vibe,
      timestamp: Date.now(),
      sourceAI: 'iris',
    };
    setState(prev => ({ ...prev, activeVibe: fullVibe }));
  }, []);

  const initiateHandoff = useCallback((vibe?: Omit<VibePayload, 'timestamp' | 'sourceAI'>) => {
    const handoffVibe: VibePayload = vibe
      ? { ...vibe, timestamp: Date.now(), sourceAI: 'iris' }
      : state.activeVibe || { userIntent: '', timestamp: Date.now(), sourceAI: 'iris' };

    setState(prev => ({
      ...prev,
      activeVibe: handoffVibe,
      isHandoffPending: true,
    }));

    // Redirect to Aegis with auto_receive flag
    router.push('/aegis?mode=auto_receive');
  }, [state.activeVibe, router]);

  const acknowledgeHandoff = useCallback(() => {
    if (!state.isHandoffPending || !state.activeVibe) return null;

    const receivedVibe = state.activeVibe;
    setState(prev => ({
      ...prev,
      isHandoffPending: false,
      handoffHistory: [...prev.handoffHistory, receivedVibe],
    }));

    return receivedVibe;
  }, [state.isHandoffPending, state.activeVibe]);

  const clearVibe = useCallback(() => {
    setState(prev => ({ ...prev, activeVibe: null, isHandoffPending: false }));
  }, []);

  const hasPendingHandoff = useCallback(() => {
    return state.isHandoffPending && state.activeVibe !== null;
  }, [state.isHandoffPending, state.activeVibe]);

  return (
    <NeuralContext.Provider value={{
      ...state,
      setActiveVibe,
      initiateHandoff,
      acknowledgeHandoff,
      clearVibe,
      hasPendingHandoff,
    }}>
      {children}
    </NeuralContext.Provider>
  );
}

// Hook for consuming context
export function useNeural() {
  const context = useContext(NeuralContext);
  if (!context) {
    throw new Error('useNeural must be used within a NeuralProvider');
  }
  return context;
}

// Export types
export type { VibePayload, NeuralState, NeuralContextType };
