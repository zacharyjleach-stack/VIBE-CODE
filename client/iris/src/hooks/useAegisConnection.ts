/**
 * useAegisConnection Hook
 * Manages WebSocket connection to Aegis for real-time updates
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useVibeStore } from '@/store/vibeStore';
import type { AgentStatus, WSMessage, WSAgentUpdatePayload, WSJobProgressPayload, WSJobCompletePayload } from '@/types';

// ==================== Configuration ====================

const WS_URL = process.env.NEXT_PUBLIC_AEGIS_WS_URL || 'ws://localhost:8080';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

// ==================== Hook Interface ====================

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
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: string, payload: unknown) => void;
}

// ==================== Hook Implementation ====================

export function useAegisConnection(
  options: UseAegisConnectionOptions = {}
): UseAegisConnectionReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Store actions
  const updateAgentStatus = useVibeStore((state) => state.updateAgentStatus);
  const setHandoffStatus = useVibeStore((state) => state.setHandoffStatus);
  const setCurrentJobId = useVibeStore((state) => state.setCurrentJobId);
  const setHandoffError = useVibeStore((state) => state.setHandoffError);
  const addMessage = useVibeStore((state) => state.addMessage);
  const setCurrentDiagram = useVibeStore((state) => state.setCurrentDiagram);

  // ==================== Message Handlers ====================

  const handleAgentUpdate = useCallback(
    (payload: WSAgentUpdatePayload) => {
      payload.agents.forEach((agent) => {
        updateAgentStatus(
          agent.id,
          agent.status,
          agent.currentTask,
          agent.progress
        );
      });
    },
    [updateAgentStatus]
  );

  const handleJobProgress = useCallback(
    (payload: WSJobProgressPayload) => {
      addMessage({
        role: 'system',
        content: `[${payload.stage}] ${payload.message} (${payload.progress}%)`,
      });
    },
    [addMessage]
  );

  const handleJobComplete = useCallback(
    (payload: WSJobCompletePayload) => {
      if (payload.success) {
        setHandoffStatus('completed');
        addMessage({
          role: 'assistant',
          content: `Your application has been generated successfully!

${payload.result?.repositoryUrl ? `**Repository:** ${payload.result.repositoryUrl}` : ''}
${payload.result?.deploymentUrl ? `**Live Preview:** ${payload.result.deploymentUrl}` : ''}

Generated artifacts:
${payload.result?.artifacts.map((a) => `- ${a}`).join('\n') || 'None'}`,
        });
      } else {
        setHandoffStatus('failed');
        addMessage({
          role: 'system',
          content: 'Job failed. Please check the error details and try again.',
        });
      }
      setCurrentJobId(null);
    },
    [setHandoffStatus, addMessage, setCurrentJobId]
  );

  const handleDiagramUpdate = useCallback(
    (payload: { diagram: string }) => {
      setCurrentDiagram(payload.diagram);
    },
    [setCurrentDiagram]
  );

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case 'agent_update':
          handleAgentUpdate(message.payload as WSAgentUpdatePayload);
          break;
        case 'job_progress':
          handleJobProgress(message.payload as WSJobProgressPayload);
          break;
        case 'job_complete':
          handleJobComplete(message.payload as WSJobCompletePayload);
          break;
        case 'diagram_update':
          handleDiagramUpdate(message.payload as { diagram: string });
          break;
        case 'job_error':
          const errorPayload = message.payload as { jobId: string; error: string };
          setHandoffError(errorPayload.error);
          setHandoffStatus('failed');
          break;
        case 'pong':
          // Keep-alive response, no action needed
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [
      handleAgentUpdate,
      handleJobProgress,
      handleJobComplete,
      handleDiagramUpdate,
      setHandoffError,
      setHandoffStatus,
    ]
  );

  // ==================== Connection Management ====================

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false, // We handle reconnection manually
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

      // Auto-reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (err) => {
      setIsConnecting(false);
      setError(`Connection failed: ${err.message}`);
      onError?.(err);
      scheduleReconnect();
    });

    socket.on('message', (data: WSMessage) => {
      handleMessage(data);
    });

    // Handle specific event types
    socket.on('agent_update', (payload: WSAgentUpdatePayload) => {
      handleMessage({ type: 'agent_update', payload, timestamp: new Date().toISOString() });
    });

    socket.on('job_progress', (payload: WSJobProgressPayload) => {
      handleMessage({ type: 'job_progress', payload, timestamp: new Date().toISOString() });
    });

    socket.on('job_complete', (payload: WSJobCompletePayload) => {
      handleMessage({ type: 'job_complete', payload, timestamp: new Date().toISOString() });
    });

    socket.on('diagram_update', (payload: { diagram: string }) => {
      handleMessage({ type: 'diagram_update', payload, timestamp: new Date().toISOString() });
    });

    socketRef.current = socket;
  }, [handleMessage, onConnect, onDisconnect, onError]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);

    const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

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
      console.warn('Cannot send message: not connected');
      return;
    }

    socketRef.current.emit(type, payload);
  }, []);

  // ==================== Effects ====================

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage('ping', { timestamp: Date.now() });
    }, 30000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
  };
}

export default useAegisConnection;
