/**
 * aegis status - Display current agent sync status
 */

import { Command } from 'commander';
import path from 'path';
import { StateManager } from '../../core/StateManager.js';
import { AgentDetector } from '../../core/AgentDetector.js';

export const statusCommand = new Command('status')
  .description('Show current Aegis status and agent sync state')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--json', 'Output as JSON')
  .action((options) => {
    const projectPath = path.resolve(options.path);
    const stateManager = new StateManager(projectPath);
    const detector = new AgentDetector(projectPath);
    const state = stateManager.getState();
    const agents = detector.detectAll();

    if (options.json) {
      console.log(JSON.stringify(state, null, 2));
      return;
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║         AEGIS STATUS DASHBOARD            ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log(`📁 Project:     ${state.projectName}`);
    console.log(`🎯 Objective:   ${state.currentObjective}`);
    console.log(`⏰ Last Update: ${new Date(state.lastUpdated).toLocaleString()}\n`);

    // Agents
    console.log('━━━ ACTIVE AGENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (agents.length === 0) {
      console.log('  No agents configured.');
    } else {
      for (const agent of agents) {
        const isActive = state.activeAgents.includes(agent.type);
        const icon = isActive ? '🟢' : '⚪';
        console.log(`  ${icon} ${agent.type.toUpperCase().padEnd(10)} ${agent.configPath}`);
      }
    }

    // Tech Stack
    if (state.sharedContext.techStack.length > 0) {
      console.log('\n━━━ TECH STACK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ' + state.sharedContext.techStack.join(' · '));
    }

    // Recent Changes
    const recent = state.sharedContext.recentChanges.slice(0, 5);
    if (recent.length > 0) {
      console.log('\n━━━ RECENT CHANGES ━━━━━━━━━━━━━━━━━━━━━━━━━');
      for (const change of recent) {
        const time = new Date(change.timestamp).toLocaleTimeString();
        console.log(`  [${change.agent.toUpperCase()}] ${change.file}`);
        console.log(`         ${change.summary} (${time})`);
      }
    }

    // Tasks
    if (state.pendingTasks.length > 0) {
      console.log('\n━━━ PENDING TASKS ━━━━━━━━━━━━━━━━━━━━━━━━━━');
      for (const task of state.pendingTasks) {
        const agent = task.assignedAgent ? ` [${task.assignedAgent}]` : '';
        console.log(`  □ ${task.description}${agent}`);
      }
    }

    // Vibe Check
    if (state.guards.lastVibeCheck) {
      const icon = state.guards.vibeCheckResult === 'pass' ? '✅' :
                   state.guards.vibeCheckResult === 'fail' ? '❌' : '⚠️';
      console.log('\n━━━ VIBE CHECK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  ${icon} Last: ${new Date(state.guards.lastVibeCheck).toLocaleString()}`);
      console.log(`     Result: ${state.guards.vibeCheckResult?.toUpperCase()}`);
    }

    // Logic Collisions
    if (state.guards.logicCollisions.length > 0) {
      console.log('\n━━━ ⚠️  LOGIC COLLISIONS ━━━━━━━━━━━━━━━━━━━━━');
      for (const c of state.guards.logicCollisions) {
        console.log(`  [${c.severity.toUpperCase()}] ${c.file}`);
        console.log(`         ${c.description}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════\n');
  });
