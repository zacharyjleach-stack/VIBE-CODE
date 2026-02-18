/**
 * aegis watch - Start the relay watcher
 * Monitors file changes and syncs all agents in real-time
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { Watcher } from '../../core/Watcher.js';
import { RelayManager } from '../../core/RelayManager.js';
import { WebSocketRelay } from '../../relay/WebSocketRelay.js';
import type { AegisConfig } from '../../types/index.js';

function loadConfig(projectPath: string): AegisConfig | null {
  const configPath = path.join(projectPath, '.aegis/config.json');
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AegisConfig;
}

function loadEnv(projectPath: string): void {
  const envPath = path.join(projectPath, '.aegis/.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^"|"$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export const watchCommand = new Command('watch')
  .description('Start watching for changes and relay context to all agents')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--no-relay', 'Disable WebSocket relay server')
  .action(async (options) => {
    const projectPath = path.resolve(options.path);

    loadEnv(projectPath);

    const config = loadConfig(projectPath);
    if (!config) {
      console.error('❌ Aegis not initialized. Run: aegis init');
      process.exit(1);
    }

    const openaiKey = process.env.OPENAI_API_KEY || config.openaiApiKey || '';
    if (!openaiKey) {
      console.warn('⚠️  No OpenAI API key found. AI analysis disabled.');
      console.warn('   Add OPENAI_API_KEY to .aegis/.env');
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║       AEGIS RELAY - ACTIVE WATCH MODE     ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log(`\nProject: ${config.projectName}`);
    console.log(`Path:    ${projectPath}\n`);

    // Start WebSocket relay
    let relay: WebSocketRelay | null = null;
    if (options.relay) {
      relay = new WebSocketRelay(config.relay.port);
    }

    // Start relay manager
    const relayManager = new RelayManager(projectPath, openaiKey);

    // Start file watcher
    const watcher = new Watcher(projectPath, config.watchPaths, config.ignorePaths);

    watcher.on('change', async (event) => {
      await relayManager.handleChange(event);

      // Broadcast to WebSocket clients
      if (relay) {
        relay.broadcastStateUpdate(relayManager.getStateManager().getState());
      }
    });

    watcher.on('error', (err: Error) => {
      console.error('Watcher error:', err.message);
    });

    relayManager.on('collision', ({ file, analysis }) => {
      console.log(`\n⚠️  LOGIC COLLISION DETECTED`);
      console.log(`   File: ${file}`);
      console.log(`   ${analysis.summary}`);
    });

    watcher.start();

    // Print live status every 30s
    setInterval(() => {
      const state = relayManager.getStateManager().getState();
      const connected = relay?.getConnectedCount() ?? 0;
      console.log(`\n📊 Status: ${state.activeAgents.length} agents | ${state.sharedContext.recentChanges.length} changes | ${connected} relay clients`);
    }, 30_000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nShutting down Aegis...');
      watcher.stop();
      relay?.close();
      process.exit(0);
    });

    console.log('Aegis is watching. Press Ctrl+C to stop.\n');
  });
