/**
 * AgentDetector - Identifies which AI agents are configured in a project
 * Detects Cursor, Claude Code, and Gemini config files
 */

import fs from 'fs';
import path from 'path';
import type { DetectedAgent, AgentType } from '../types/index.js';

const AGENT_CONFIG_PATTERNS: Record<AgentType, string[]> = {
  cursor: [
    '.cursorrules',
    '.cursor/rules',
    '.cursor/settings.json',
  ],
  claude: [
    'CLAUDE.md',
    '.claude/settings.json',
    '.claudeignore',
  ],
  gemini: [
    '.gemini/config.json',
    'gemini.config.js',
    '.gemini',
  ],
  unknown: [],
};

export class AgentDetector {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Scan the project directory for all known agent configs
   */
  detectAll(): DetectedAgent[] {
    const detected: DetectedAgent[] = [];

    for (const [agentType, patterns] of Object.entries(AGENT_CONFIG_PATTERNS)) {
      if (agentType === 'unknown') continue;

      for (const pattern of patterns) {
        const fullPath = path.join(this.projectPath, pattern);
        if (fs.existsSync(fullPath)) {
          detected.push({
            type: agentType as AgentType,
            configPath: fullPath,
            exists: true,
          });
          break; // Only count each agent once
        }
      }
    }

    return detected;
  }

  /**
   * Check if a specific agent is configured
   */
  detectAgent(agentType: AgentType): DetectedAgent | null {
    const patterns = AGENT_CONFIG_PATTERNS[agentType];
    if (!patterns) return null;

    for (const pattern of patterns) {
      const fullPath = path.join(this.projectPath, pattern);
      if (fs.existsSync(fullPath)) {
        return { type: agentType, configPath: fullPath, exists: true };
      }
    }

    return { type: agentType, configPath: '', exists: false };
  }

  /**
   * Get the primary config file path for an agent (creates if needed)
   */
  getPrimaryConfigPath(agentType: AgentType): string {
    const primaryPaths: Record<string, string> = {
      cursor: path.join(this.projectPath, '.cursorrules'),
      claude: path.join(this.projectPath, 'CLAUDE.md'),
      gemini: path.join(this.projectPath, '.gemini', 'config.json'),
    };
    return primaryPaths[agentType] || '';
  }

  /**
   * Read the current content of an agent's config
   */
  readConfig(agentType: AgentType): string | null {
    const detected = this.detectAgent(agentType);
    if (!detected?.exists) return null;

    try {
      return fs.readFileSync(detected.configPath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Write updated instructions to an agent's config file
   */
  writeConfig(agentType: AgentType, content: string): void {
    const configPath = this.getPrimaryConfigPath(agentType);
    const dir = path.dirname(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, content, 'utf-8');
  }

  /**
   * Format a summary report of detected agents
   */
  getSummary(): string {
    const detected = this.detectAll();

    if (detected.length === 0) {
      return 'No AI agent configurations detected.';
    }

    const lines = ['Detected AI Agents:'];
    for (const agent of detected) {
      lines.push(`  ✓ ${agent.type.toUpperCase()} → ${agent.configPath}`);
    }

    const missing = (['cursor', 'claude', 'gemini'] as AgentType[])
      .filter(t => !detected.find(d => d.type === t));

    if (missing.length > 0) {
      lines.push('\nNot detected:');
      for (const m of missing) {
        lines.push(`  ○ ${m.toUpperCase()} (will be initialized on first sync)`);
      }
    }

    return lines.join('\n');
  }
}
