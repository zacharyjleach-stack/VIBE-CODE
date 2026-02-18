/**
 * WebSocketRelay - Local WebSocket server for real-time agent sync
 * All agents can subscribe and receive instant context updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { RelayMessage, AgentType } from '../types/index.js';

export class WebSocketRelay {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private port: number;

  constructor(port: number = 7734) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    console.log(`⚡ Aegis Relay listening on ws://localhost:${port}`);
  }

  private setupHandlers(): void {
    this.wss.on('connection', (ws, req) => {
      const clientId = req.headers['x-agent-id'] as string || `client_${Date.now()}`;
      this.clients.set(clientId, ws);
      console.log(`  → Agent connected: ${clientId}`);

      ws.send(JSON.stringify({
        type: 'state_update',
        agent: 'aegis' as AgentType,
        payload: { message: 'Connected to Aegis Relay' },
        timestamp: new Date().toISOString(),
      } satisfies RelayMessage));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as RelayMessage;
          this.broadcast(msg, clientId);
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`  ← Agent disconnected: ${clientId}`);
      });
    });
  }

  broadcast(message: RelayMessage, excludeClientId?: string): void {
    const payload = JSON.stringify(message);
    for (const [id, client] of this.clients.entries()) {
      if (id !== excludeClientId && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  broadcastStateUpdate(state: unknown): void {
    this.broadcast({
      type: 'state_update',
      agent: 'unknown',
      payload: state,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.wss.close();
  }
}
