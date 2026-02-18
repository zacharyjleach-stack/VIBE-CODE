/**
 * StateManager - Manages AEGIS_STATE.json
 * The central memory bus for all AI agents
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  AegisState,
  AgentType,
  RecentChange,
  Task,
  LogicCollision,
} from '../types/index.js';

const STATE_FILE = 'AEGIS_STATE.json';
const MAX_RECENT_CHANGES = 20;

export class StateManager {
  private projectPath: string;
  private statePath: string;
  private state: AegisState;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.statePath = path.join(projectPath, STATE_FILE);
    this.state = this.load();
  }

  /**
   * Load state from disk or create default
   */
  private load(): AegisState {
    if (fs.existsSync(this.statePath)) {
      try {
        const raw = fs.readFileSync(this.statePath, 'utf-8');
        return JSON.parse(raw) as AegisState;
      } catch {
        // Corrupt state - start fresh
      }
    }

    return this.createDefault();
  }

  /**
   * Create a default state for a new project
   */
  private createDefault(): AegisState {
    const projectName = path.basename(this.projectPath);
    return {
      version: '1.0.0',
      projectName,
      projectPath: this.projectPath,
      currentObjective: 'Project initialized. Define your objective.',
      lastUpdated: new Date().toISOString(),
      activeAgents: [],
      completedTasks: [],
      pendingTasks: [],
      sharedContext: {
        techStack: [],
        conventions: [],
        recentChanges: [],
        criticalFiles: [],
        doNotTouch: [],
      },
      guards: {
        logicCollisions: [],
      },
    };
  }

  /**
   * Persist state to disk
   */
  save(): void {
    this.state.lastUpdated = new Date().toISOString();
    const json = JSON.stringify(this.state, null, 2);
    fs.writeFileSync(this.statePath, json, 'utf-8');
  }

  /**
   * Get the full current state
   */
  getState(): AegisState {
    return this.state;
  }

  /**
   * Update the current objective
   */
  setObjective(objective: string): void {
    this.state.currentObjective = objective;
    this.save();
  }

  /**
   * Record a file change from an agent
   */
  recordChange(file: string, agent: AgentType, summary: string): void {
    const change: RecentChange = {
      file,
      agent,
      summary,
      timestamp: new Date().toISOString(),
    };

    this.state.sharedContext.recentChanges.unshift(change);

    // Keep only the most recent changes
    if (this.state.sharedContext.recentChanges.length > MAX_RECENT_CHANGES) {
      this.state.sharedContext.recentChanges = this.state.sharedContext.recentChanges.slice(0, MAX_RECENT_CHANGES);
    }

    // Track active agent
    if (!this.state.activeAgents.includes(agent)) {
      this.state.activeAgents.push(agent);
    }

    this.save();
  }

  /**
   * Add a pending task
   */
  addTask(description: string, assignedAgent?: AgentType): Task {
    const task: Task = {
      id: uuidv4(),
      description,
      assignedAgent,
      files: [],
    };
    this.state.pendingTasks.push(task);
    this.save();
    return task;
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string): void {
    const index = this.state.pendingTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.state.pendingTasks.splice(index, 1)[0];
      task.completedAt = new Date().toISOString();
      this.state.completedTasks.unshift(task);
      this.save();
    }
  }

  /**
   * Update tech stack
   */
  updateTechStack(stack: string[]): void {
    this.state.sharedContext.techStack = [...new Set([
      ...this.state.sharedContext.techStack,
      ...stack,
    ])];
    this.save();
  }

  /**
   * Add a logic collision
   */
  addLogicCollision(collision: Omit<LogicCollision, 'detectedAt'>): void {
    this.state.guards.logicCollisions.push({
      ...collision,
      detectedAt: new Date().toISOString(),
    });
    this.save();
  }

  /**
   * Update vibe check result
   */
  updateVibeCheck(result: 'pass' | 'fail' | 'warning'): void {
    this.state.guards.lastVibeCheck = new Date().toISOString();
    this.state.guards.vibeCheckResult = result;
    this.save();
  }

  /**
   * Generate a compact context string for agent instructions
   */
  generateContextSummary(): string {
    const s = this.state;
    const lines = [
      `# AEGIS SHARED CONTEXT`,
      `Last Updated: ${s.lastUpdated}`,
      ``,
      `## Current Objective`,
      s.currentObjective,
      ``,
    ];

    if (s.sharedContext.techStack.length > 0) {
      lines.push(`## Tech Stack`);
      lines.push(s.sharedContext.techStack.map(t => `- ${t}`).join('\n'));
      lines.push('');
    }

    if (s.sharedContext.recentChanges.length > 0) {
      lines.push(`## Recent Changes (last ${Math.min(5, s.sharedContext.recentChanges.length)})`);
      for (const change of s.sharedContext.recentChanges.slice(0, 5)) {
        lines.push(`- [${change.agent.toUpperCase()}] ${change.file}: ${change.summary}`);
      }
      lines.push('');
    }

    if (s.sharedContext.conventions.length > 0) {
      lines.push(`## Conventions`);
      lines.push(s.sharedContext.conventions.map(c => `- ${c}`).join('\n'));
      lines.push('');
    }

    if (s.sharedContext.doNotTouch.length > 0) {
      lines.push(`## DO NOT TOUCH`);
      lines.push(s.sharedContext.doNotTouch.map(f => `- ${f}`).join('\n'));
      lines.push('');
    }

    if (s.guards.logicCollisions.length > 0) {
      lines.push(`## ⚠️ Active Logic Collisions`);
      for (const c of s.guards.logicCollisions) {
        lines.push(`- [${c.severity.toUpperCase()}] ${c.file}: ${c.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
