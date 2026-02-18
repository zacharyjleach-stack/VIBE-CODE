/**
 * WebSocketRelay - Local WebSocket server for real-time agent sync
 * Broadcasts to HUD, Nexus, and all connected agents simultaneously
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { RelayMessage, AgentType } from '../types/index.js';

export class WebSocketRelay {
  private wss: WebSocketServer;
  private clients: Map<string, { ws: WebSocket; agentType?: string }> = new Map();
  private port: number;
  private messageHistory: RelayMessage[] = [];
  private readonly MAX_HISTORY = 100;

  constructor(port: number = 7734) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    console.log(`⚡ Aegis Relay on ws://localhost:${port}`);
    console.log(`   Nexus: http://localhost:3737`);
  }

  private setupHandlers(): void {
    this.wss.on('connection', (ws, req) => {
      const clientId = (req.headers['x-agent-id'] as string) || `client_${Date.now()}`;
      const agentType = req.headers['x-agent-type'] as string;
      this.clients.set(clientId, { ws, agentType });
      console.log(`  → Connected: ${clientId}${agentType ? ` (${agentType})` : ''}`);

      // Replay recent history so HUD/Nexus catch up instantly
      for (const msg of this.messageHistory.slice(-20)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      }

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as RelayMessage;
          this.broadcast(msg, clientId);
        } catch { /* ignore */ }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`  ← Disconnected: ${clientId}`);
      });
    });
  }

  broadcast(message: RelayMessage, excludeClientId?: string): void {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) this.messageHistory.shift();

    const payload = JSON.stringify(message);
    for (const [id, client] of this.clients.entries()) {
      if (id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  broadcastStateUpdate(state: unknown): void {
    this.broadcast({
      type: 'state_update',
      agent: 'aegis' as AgentType,
      payload: { state },
      timestamp: new Date().toISOString(),
    });
  }

  broadcastFileChange(file: string, agent: AgentType, summary: string): void {
    this.broadcast({
      type: 'agent_sync',
      agent,
      payload: { file, summary } as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastVibeCheck(vibeScore: number, screenshotPath: string, summary: string): void {
    this.broadcast({
      type: 'vibe_check' as RelayMessage['type'],
      agent: 'aegis' as AgentType,
      payload: { vibeScore, screenshotPath, summary } as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastTokenUsage(total: number, cost: number): void {
    this.broadcast({
      type: 'state_update',
      agent: 'aegis' as AgentType,
      payload: { tokenUsage: { total, cost } } as unknown as Record<string, unknown>,
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
