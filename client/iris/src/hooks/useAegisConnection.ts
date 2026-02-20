'use client';

/**
 * useAegisConnection Hook
 * Manages Socket.IO connection to Aegis for real-time swarm updates.
 *
 * Backend runs on port 3001. Events are namespaced with colons:
 *   agent:spawned, agent:status_changed, agent:task_completed, agent:task_failed, agent:terminated
 *   mission:initialized, mission:in_progress, mission:completed, mission:failed, mission:cancelled
 *   task:started, task:progress, task:completed, task:failed
 *
 * Client sends:
 *   subscribe:mission <missionId>  — to receive events for a specific mission
 *   subscribe:all                  — admin: receive all events
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useVibeStore } from '@/store/vibeStore';

// ==================== Configuration ====================

// Aegis runs Socket.IO on port 3001 (same server as HTTP API)
const WS_URL = process.env.NEXT_PUBLIC_AEGIS_WS_URL || 'http://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 3000;

// ==================== Types ====================

export interface SwarmAgentInfo {
  id: string;
  name: string;
  status: string; // Aegis AgentStatus enum: Idle | Initializing | Coding | Testing | Reviewing | Complete | Error
  currentTask?: string;
  progress: number;
}

export interface HookSwarmState {
  agents: SwarmAgentInfo[]; // 16 slots indexed 0-15
  overallProgress: number;
  missionId: string | null;
  phase: string;
  activeAgents: number;
}

interface UseAegisConnectionOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseAegisConnectionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  swarmState: HookSwarmState | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: string, payload: unknown) => void;
}

// ==================== Status Mapping ====================

// Map Aegis internal AgentStatusType (lowercase, from src/types/index.ts) to the
// store's AgentStatus type. The backend emits lowercase values in socket events.
const AEGIS_TO_STORE_STATUS: Record<string, string> = {
  idle: 'idle',
  initializing: 'working',
  coding: 'working',
  testing: 'working',
  complete: 'success',
  error: 'error',
  terminated: 'idle',
};

function makeEmptySlots(): SwarmAgentInfo[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `slot-${i}`,
    name: `Worker ${i + 1}`,
    status: 'Idle',
    currentTask: undefined,
    progress: 0,
  }));
}

// ==================== Hook ====================

export function useAegisConnection(
  options: UseAegisConnectionOptions = {}
): UseAegisConnectionReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  // agentId → slotIndex, populated from agent:spawned events
  const agentSlotMap = useRef<Map<string, number>>(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [swarmState, setSwarmState] = useState<HookSwarmState | null>(null);
  const [swarmSlots, setSwarmSlots] = useState<SwarmAgentInfo[]>(makeEmptySlots);

  // Store actions
  const currentJobId = useVibeStore((state) => state.currentJobId);
  const updateAgentStatus = useVibeStore((state) => state.updateAgentStatus);
  const setHandoffStatus = useVibeStore((state) => state.setHandoffStatus);
  const setCurrentJobId = useVibeStore((state) => state.setCurrentJobId);
  const setHandoffError = useVibeStore((state) => state.setHandoffError);
  const addMessage = useVibeStore((state) => state.addMessage);

  // ==================== Slot Helpers ====================

  const updateSlot = useCallback((slotIndex: number, patch: Partial<SwarmAgentInfo>) => {
    setSwarmSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], ...patch };
      return next;
    });
  }, []);

  // ==================== Subscribe to mission after connection / jobId change ====================

  useEffect(() => {
    if (currentJobId && socketRef.current?.connected) {
      socketRef.current.emit('subscribe:mission', currentJobId, (ok: boolean) => {
        if (ok) {
          addMessage({ role: 'system', content: `Subscribed to mission ${currentJobId.slice(0, 8)}…` });
        }
      });
    }
  }, [currentJobId, isConnected, addMessage]);

  // Sync swarmState from swarmSlots + metadata
  useEffect(() => {
    if (currentJobId) {
      const activeAgents = swarmSlots.filter(
        (s) => s.status !== 'Idle' && s.status !== 'Complete' && s.status !== 'Error'
      ).length;
      const totalProgress =
        swarmSlots.reduce((sum, s) => sum + s.progress, 0) / swarmSlots.length;

      setSwarmState({
        agents: swarmSlots,
        overallProgress: Math.round(totalProgress),
        missionId: currentJobId,
        phase: 'Running',
        activeAgents,
      });
    }
  }, [swarmSlots, currentJobId]);

  // ==================== Socket Event Handlers ====================

  const attachSocketHandlers = useCallback(
    (socket: Socket) => {
      // ---- Connection ----
      socket.on('connected', () => {
        // If there's an active mission, subscribe immediately
        const jobId = useVibeStore.getState().currentJobId;
        if (jobId) {
          socket.emit('subscribe:mission', jobId);
        }
      });

      // ---- Agent lifecycle ----

      // agent:spawned → register slot mapping and initialize slot
      socket.on('agent:spawned', (payload: {
        missionId: string; agentId: string; agentName: string; slotIndex: number;
        task?: { title?: string };
      }) => {
        agentSlotMap.current.set(payload.agentId, payload.slotIndex);
        updateSlot(payload.slotIndex, {
          id: payload.agentId,
          name: payload.agentName || `Worker ${payload.slotIndex + 1}`,
          status: 'Initializing',
          currentTask: payload.task?.title,
          progress: 0,
        });
      });

      // agent:status_changed → update slot status + store
      socket.on('agent:status_changed', (payload: {
        missionId: string; agentId: string;
        previousStatus: string; newStatus: string; progress?: number;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;

        updateSlot(slotIndex, {
          status: payload.newStatus,
          progress: payload.progress ?? 0,
        });

        const storeStatus = AEGIS_TO_STORE_STATUS[payload.newStatus] || 'idle';
        updateAgentStatus(slotIndex + 1, storeStatus as never, undefined, payload.progress);
      });

      // agent:terminated → reset slot to idle
      socket.on('agent:terminated', (payload: {
        missionId: string; agentId: string;
        reason: string; finalStatus: string;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;

        const storeStatus = AEGIS_TO_STORE_STATUS[payload.finalStatus] || 'idle';
        updateSlot(slotIndex, { status: payload.finalStatus, progress: 100 });
        updateAgentStatus(slotIndex + 1, storeStatus as never, undefined, undefined);
        agentSlotMap.current.delete(payload.agentId);
      });

      // ---- Task events ----

      // task:started → update slot's currentTask
      socket.on('task:started', (payload: {
        missionId: string; taskId: string; title: string; agentId: string; priority: string;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;

        updateSlot(slotIndex, { currentTask: payload.title, status: 'Coding', progress: 0 });
        updateAgentStatus(slotIndex + 1, 'working', payload.title, 0);
      });

      // task:progress → update slot progress
      socket.on('task:progress', (payload: {
        missionId: string; taskId: string; agentId: string;
        progress: number; currentStep?: string;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;

        updateSlot(slotIndex, {
          progress: payload.progress,
          currentTask: payload.currentStep ?? undefined,
        });
        updateAgentStatus(slotIndex + 1, 'working', payload.currentStep, payload.progress);
      });

      // task:completed → mark slot as complete
      socket.on('task:completed', (payload: {
        missionId: string; taskId: string; agentId: string;
        duration: number;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;
        updateSlot(slotIndex, { status: 'Complete', progress: 100 });
        updateAgentStatus(slotIndex + 1, 'success', undefined, 100);
      });

      // task:failed → mark slot as error
      socket.on('task:failed', (payload: {
        missionId: string; taskId: string; agentId: string;
        error: { message: string }; retryCount: number; willRetry: boolean;
      }) => {
        const slotIndex = agentSlotMap.current.get(payload.agentId);
        if (slotIndex === undefined) return;
        updateSlot(slotIndex, { status: payload.willRetry ? 'Initializing' : 'Error' });
        if (!payload.willRetry) {
          updateAgentStatus(slotIndex + 1, 'error', payload.error.message, undefined);
        }
      });

      // ---- Mission lifecycle ----

      socket.on('mission:initialized', (payload: {
        missionId: string; title: string; totalTasks: number; maxAgents: number;
      }) => {
        addMessage({
          role: 'system',
          content: `Mission initialized: "${payload.title}" — ${payload.totalTasks} tasks, ${payload.maxAgents} agents`,
        });
        // Reset all slots for the new mission
        agentSlotMap.current.clear();
        setSwarmSlots(makeEmptySlots());
      });

      socket.on('mission:in_progress', (payload: {
        missionId: string; progress: number;
        completedTasks: number; totalTasks: number; activeAgents: number;
      }) => {
        setSwarmState((prev) => prev ? { ...prev, overallProgress: Math.round(payload.progress) } : null);
        // Throttle progress messages — only post every 25%
        if (payload.completedTasks > 0 && payload.completedTasks % Math.ceil(payload.totalTasks / 4) === 0) {
          addMessage({
            role: 'system',
            content: `[Aegis] ${payload.completedTasks}/${payload.totalTasks} tasks complete (${Math.round(payload.progress)}%)`,
          });
        }
      });

      socket.on('mission:completed', (payload: {
        missionId: string; totalTasks: number; completedTasks: number;
        failedTasks: number; duration: number; outputPath: string;
        summary: { filesCreated: number; filesModified: number; testsRun: number; testsPassed: number };
      }) => {
        setHandoffStatus('completed');
        setCurrentJobId(null);
        addMessage({
          role: 'assistant',
          content: `**Mission complete!** ${payload.completedTasks}/${payload.totalTasks} tasks done in ${Math.round(payload.duration / 1000)}s.\n\n**${payload.summary.filesCreated}** files created · **${payload.summary.filesModified}** modified · **${payload.summary.testsPassed}/${payload.summary.testsRun}** tests passed\n\nOutput: \`${payload.outputPath}\``,
        });
        agentSlotMap.current.clear();
        setSwarmSlots(makeEmptySlots());
        setSwarmState(null);
      });

      socket.on('mission:failed', (payload: {
        missionId: string; error: { message: string; recoverable: boolean };
        completedTasks: number; failedTasks: number; duration: number;
      }) => {
        setHandoffStatus('failed');
        setHandoffError(payload.error.message);
        addMessage({
          role: 'system',
          content: `Mission failed after ${Math.round(payload.duration / 1000)}s: ${payload.error.message}`,
        });
      });

      socket.on('mission:cancelled', (payload: {
        missionId: string; reason: string; cancelledBy: string;
        completedTasks: number; pendingTasks: number;
      }) => {
        setHandoffStatus('idle');
        setCurrentJobId(null);
        addMessage({
          role: 'system',
          content: `Mission cancelled by ${payload.cancelledBy}: ${payload.reason}. (${payload.completedTasks} tasks completed, ${payload.pendingTasks} pending)`,
        });
        agentSlotMap.current.clear();
        setSwarmSlots(makeEmptySlots());
        setSwarmState(null);
      });

      // Generic error from server
      socket.on('error', (err: { message: string; code?: string }) => {
        setError(`Aegis error: ${err.message}`);
      });
    },
    [updateSlot, updateAgentStatus, setHandoffStatus, setCurrentJobId, setHandoffError, addMessage]
  );

  // ==================== Connection Management ====================

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);
    const delay = RECONNECT_BASE_DELAY * reconnectAttemptsRef.current;

    reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    setError(null);

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false, // manual reconnect
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempts(0);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      onDisconnect?.();
      if (reason !== 'io client disconnect') scheduleReconnect();
    });

    socket.on('connect_error', (err) => {
      setIsConnecting(false);
      setError(`Could not reach Aegis: ${err.message}`);
      onError?.(err);
      scheduleReconnect();
    });

    attachSocketHandlers(socket);
    socketRef.current = socket;
  }, [attachSocketHandlers, onConnect, onDisconnect, onError, scheduleReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot send message: not connected to Aegis');
      return;
    }
    socketRef.current.emit(type, payload);
  }, []);

  // ==================== Effects ====================

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      socketRef.current?.emit('ping', (pong: string) => {
        if (pong !== 'pong') console.warn('Unexpected ping response from Aegis');
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    swarmState,
    connect,
    disconnect,
    sendMessage,
  };
}

export default useAegisConnection;
