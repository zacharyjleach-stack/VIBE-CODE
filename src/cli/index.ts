#!/usr/bin/env node
/**
 * AEGIS CLI - Universal Agentic Bridge & Governance Layer
 * Connects Cursor, Claude Code, and Gemini into a synchronized team
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { verifyCommand } from './commands/verify.js';
import { statusCommand } from './commands/status.js';
import { upgradeCommand } from './commands/upgrade.js';

const program = new Command();

program
  .name('aegis')
  .description('Universal Agentic Bridge - Sync your AI coding team')
  .version('1.0.0')
  .addCommand(initCommand)
  .addCommand(watchCommand)
  .addCommand(verifyCommand)
  .addCommand(statusCommand)
  .addCommand(upgradeCommand);

// Quick help display
program.addHelpText('after', `
Examples:
  $ aegis init                   Initialize in current directory
  $ aegis watch                  Start watching and relaying changes
  $ aegis verify http://localhost:3000  Run visual vibe check
  $ aegis status                 Show sync status
  $ aegis upgrade                View pricing and upgrade your plan

Relay Bridge (WebSocket): ws://localhost:7734
State File: AEGIS_STATE.json
Token Sentry:  add AEGIS_API_KEY to .aegis/.env
`);

program.parse(process.argv);
