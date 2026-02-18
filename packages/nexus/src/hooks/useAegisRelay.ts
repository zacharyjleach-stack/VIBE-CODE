'use client';

import { useState, useEffect, useRef } from 'react';

interface AegisState {
  projectName?: string;
  currentObjective?: string;
  activeAgents?: string[];
  sharedContext?: {
    recentChanges?: Array<{ file: string; agent: string; summary: string; timestamp: string }>;
  };
}

interface RelayEvent {
  type: string;
  agent?: string;
  payload?: {
    state?: AegisState;
    summary?: string;
    file?: string;
    message?: string;
    tokenUsage?: { total: number; cost: number };
  };
  timestamp: string;
}

interface TokenUsage {
  totalTokens: number;
  totalCost: number;
  sessionTokens: number;
  sessionCost: number;
}

export function useAegisRelay(url = 'ws://localhost:7734') {
  const [state, setState] = useState<AegisState | null>(null);
  const [events, setEvents] = useState<RelayEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    totalTokens: 0, totalCost: 0, sessionTokens: 0, sessionCost: 0,
  });
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: RelayEvent = JSON.parse(event.data);
          setEvents(prev => [...prev.slice(-99), msg]);

          if (msg.type === 'state_update' && msg.payload?.state) {
            setState(msg.payload.state);
          }

          if (msg.payload?.tokenUsage) {
            const t = msg.payload.tokenUsage;
            setTokenUsage(prev => ({
              totalTokens: prev.totalTokens + t.total,
              totalCost: prev.totalCost + t.cost,
              sessionTokens: t.total,
              sessionCost: t.cost,
            }));
          }
        } catch { /* ignore */ }
      };
    }

    connect();
    return () => ws.current?.close();
  }, [url]);

  return { state, events, tokenUsage, connected };
}
