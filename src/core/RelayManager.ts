/**
 * RelayManager - The core relay bus
 * Receives file changes, analyzes them, and syncs all agents
 */

import { EventEmitter } from 'events';
import type { FileChangeEvent } from './Watcher.js';
import { StateManager } from './StateManager.js';
import { AgentDetector } from './AgentDetector.js';
import { OpenAIBridge } from '../brain/OpenAIBridge.js';
import type { AgentType, DiffAnalysis } from '../types/index.js';

export class RelayManager extends EventEmitter {
  private stateManager: StateManager;
  private agentDetector: AgentDetector;
  private openAIBridge: OpenAIBridge;
  private projectPath: string;
  private processing: boolean = false;
  private queue: FileChangeEvent[] = [];

  constructor(
    projectPath: string,
    openaiApiKey: string
  ) {
    super();
    this.projectPath = projectPath;
    this.stateManager = new StateManager(projectPath);
    this.agentDetector = new AgentDetector(projectPath);
    this.openAIBridge = new OpenAIBridge(openaiApiKey);
  }

  /**
   * Process a file change event
   */
  async handleChange(event: FileChangeEvent): Promise<void> {
    this.queue.push(event);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      try {
        await this.processEvent(event);
      } catch (err) {
        console.error('RelayManager error:', err);
      }
    }

    this.processing = false;
  }

  private async processEvent(event: FileChangeEvent): Promise<void> {
    const { relativePath, agent, oldContent, newContent } = event;

    // Skip binary or very large files
    if (newContent && newContent.length > 100_000) return;

    console.log(`\n⚡ Change detected: ${relativePath} (${agent})`);

    // Generate diff
    const diff = this.generateDiff(oldContent, newContent);
    if (!diff || diff.trim().length === 0) return;

    // Analyze with OpenAI
    let analysis: DiffAnalysis;
    try {
      analysis = await this.openAIBridge.analyzeDiff(
        relativePath,
        diff,
        this.stateManager.generateContextSummary()
      );
    } catch (err) {
      console.error('OpenAI analysis failed, using fallback:', err);
      analysis = this.fallbackAnalysis(relativePath, diff);
    }

    // Update state
    this.stateManager.recordChange(relativePath, agent, analysis.summary);

    // Check for logic collisions
    if (analysis.riskLevel === 'high') {
      this.stateManager.addLogicCollision({
        file: relativePath,
        description: analysis.summary,
        severity: 'high',
      });
      this.emit('collision', { file: relativePath, analysis });
    }

    // Sync all active agents with new context
    await this.syncAgents(analysis, agent);

    // Emit relay event for WebSocket broadcast
    this.emit('relay', {
      file: relativePath,
      agent,
      analysis,
      state: this.stateManager.getState(),
    });

    console.log(`✓ Relayed to all agents: ${analysis.summary}`);
  }

  private generateDiff(oldContent?: string, newContent?: string): string {
    if (!oldContent && newContent) {
      return `[NEW FILE]\n${newContent.slice(0, 2000)}`;
    }
    if (oldContent && !newContent) {
      return `[DELETED FILE]`;
    }
    if (!oldContent || !newContent) return '';

    // Simple line diff
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    let changes = 0;

    for (let i = 0; i < maxLines && changes < 50; i++) {
      const old = oldLines[i] || '';
      const next = newLines[i] || '';
      if (old !== next) {
        if (old) diff.push(`- ${old}`);
        if (next) diff.push(`+ ${next}`);
        changes++;
      }
    }

    return diff.join('\n');
  }

  private fallbackAnalysis(file: string, diff: string): DiffAnalysis {
    const lines = diff.split('\n').length;
    return {
      summary: `Modified ${file} (${lines} line changes)`,
      affectedComponents: [file],
      crossAgentInstructions: `File ${file} was recently modified. Review before making changes.`,
      riskLevel: 'low',
      suggestedNextSteps: [],
    };
  }

  private async syncAgents(analysis: DiffAnalysis, sourceAgent: AgentType): Promise<void> {
    const detectedAgents = this.agentDetector.detectAll();
    const contextSummary = this.stateManager.generateContextSummary();

    for (const agent of detectedAgents) {
      if (agent.type === sourceAgent) continue; // Don't update the source agent

      try {
        const instructions = await this.openAIBridge.generateAgentInstructions(
          agent.type,
          contextSummary,
          analysis
        );

        this.agentDetector.writeConfig(agent.type, instructions);
        console.log(`  → Synced ${agent.type.toUpperCase()}`);
      } catch (err) {
        console.error(`  ✗ Failed to sync ${agent.type}:`, err);
      }
    }
  }

  getStateManager(): StateManager {
    return this.stateManager;
  }
}
