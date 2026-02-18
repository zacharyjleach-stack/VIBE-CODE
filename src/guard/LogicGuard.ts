/**
 * LogicGuard - Detects logic collisions between agents
 */

import { OpenAIBridge } from '../brain/OpenAIBridge.js';
import { StateManager } from '../core/StateManager.js';
import type { LogicCollision } from '../types/index.js';

export class LogicGuard {
  private openAIBridge: OpenAIBridge;
  private stateManager: StateManager;

  constructor(openaiApiKey: string, stateManager: StateManager) {
    this.openAIBridge = new OpenAIBridge(openaiApiKey);
    this.stateManager = stateManager;
  }

  async checkForCollisions(
    filePath: string,
    newDiff: string
  ): Promise<LogicCollision[]> {
    const state = this.stateManager.getState();
    const recentChanges = state.sharedContext.recentChanges.slice(0, 10);

    if (recentChanges.length === 0) return [];

    const context = recentChanges
      .map(c => `[${c.agent}] ${c.file}: ${c.summary}`)
      .join('\n');

    const response = await this.openAIBridge['client'].chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are a Logic Guard. Detect if this new change conflicts with recent changes.

RECENT CHANGES:
${context}

NEW CHANGE IN ${filePath}:
${newDiff.slice(0, 2000)}

If there are conflicts, respond with JSON array:
[{"file": "path", "description": "conflict description", "severity": "low|medium|high"}]

If no conflicts: []`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    try {
      const content = response.choices[0]?.message?.content;
      if (!content) return [];
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.collisions || [];
    } catch {
      return [];
    }
  }
}
