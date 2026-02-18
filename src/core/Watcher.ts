/**
 * Watcher - File system monitor using Chokidar
 * Intercepts all file changes and routes them to RelayManager
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { AgentType } from '../types/index.js';

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  filePath: string;
  relativePath: string;
  agent: AgentType;
  oldContent?: string;
  newContent?: string;
  diff?: string;
}

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  'AEGIS_STATE.json',
  '**/*.log',
  '**/.DS_Store',
];

// Detect which agent likely made a change based on recent git activity or timing
const AGENT_CONFIG_FILES: Record<string, AgentType> = {
  '.cursorrules': 'cursor',
  'CLAUDE.md': 'claude',
  '.gemini/config.json': 'gemini',
};

export class Watcher extends EventEmitter {
  private projectPath: string;
  private watchPaths: string[];
  private ignorePaths: string[];
  private watcher: FSWatcher | null = null;
  private fileCache: Map<string, string> = new Map();

  constructor(
    projectPath: string,
    watchPaths: string[] = ['.'],
    ignorePaths: string[] = []
  ) {
    super();
    this.projectPath = projectPath;
    this.watchPaths = watchPaths.map(p => path.join(projectPath, p));
    this.ignorePaths = [...DEFAULT_IGNORE, ...ignorePaths];
  }

  start(): void {
    console.log(`👁  Aegis watching: ${this.projectPath}`);

    this.watcher = chokidar.watch(this.watchPaths, {
      ignored: this.ignorePaths,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      usePolling: false,
    });

    this.watcher
      .on('add', (filePath) => this.handleChange('add', filePath))
      .on('change', (filePath) => this.handleChange('change', filePath))
      .on('unlink', (filePath) => this.handleChange('unlink', filePath))
      .on('error', (error) => this.emit('error', error))
      .on('ready', () => {
        console.log('✓ Watcher ready. Monitoring for changes...');
        this.emit('ready');
      });
  }

  private handleChange(type: 'add' | 'change' | 'unlink', filePath: string): void {
    const relativePath = path.relative(this.projectPath, filePath);

    let newContent: string | undefined;
    let oldContent: string | undefined = this.fileCache.get(filePath);

    if (type !== 'unlink') {
      try {
        newContent = fs.readFileSync(filePath, 'utf-8');
        this.fileCache.set(filePath, newContent);
      } catch {
        return;
      }
    } else {
      this.fileCache.delete(filePath);
    }

    const agent = this.detectAgent(relativePath);

    const event: FileChangeEvent = {
      type,
      filePath,
      relativePath,
      agent,
      oldContent,
      newContent,
    };

    this.emit('change', event);
  }

  private detectAgent(relativePath: string): AgentType {
    // Check if the changed file IS an agent config
    for (const [pattern, agent] of Object.entries(AGENT_CONFIG_FILES)) {
      if (relativePath.includes(pattern)) return agent;
    }

    // Default: unknown (will be analyzed by OpenAI)
    return 'unknown';
  }

  /**
   * Pre-populate cache with current file contents (for diff generation)
   */
  primeCache(filePaths: string[]): void {
    for (const filePath of filePaths) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.fileCache.set(filePath, content);
      } catch {
        // Skip unreadable files
      }
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('Watcher stopped.');
    }
  }
}
