/**
 * aegis init - Initialize Aegis in a project directory
 * Detects existing agents, scaffolds config files, sets up DB
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { AgentDetector } from '../../core/AgentDetector.js';
import { StateManager } from '../../core/StateManager.js';
import type { AegisConfig } from '../../types/index.js';

const CONFIG_FILE = '.aegis/config.json';
const ENV_FILE = '.aegis/.env';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

export const initCommand = new Command('init')
  .description('Initialize Aegis in the current project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    const projectPath = path.resolve(options.path);

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║   AEGIS - Universal Agentic Bridge v1.0   ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`Initializing in: ${projectPath}\n`);

    // Step 1: Detect existing agents
    const detector = new AgentDetector(projectPath);
    console.log('Scanning for AI agent configurations...');
    console.log(detector.getSummary());
    console.log('');

    // Step 2: Create .aegis directory
    const aegisDir = path.join(projectPath, '.aegis');
    if (!fs.existsSync(aegisDir)) {
      fs.mkdirSync(aegisDir, { recursive: true });
      fs.mkdirSync(path.join(aegisDir, 'screenshots'), { recursive: true });
    }

    // Step 3: Get project name
    let projectName = path.basename(projectPath);
    if (!options.yes) {
      const input = await prompt(`Project name [${projectName}]: `);
      if (input.trim()) projectName = input.trim();
    }

    // Step 4: Get objective
    let objective = 'Define your current objective';
    if (!options.yes) {
      const input = await prompt('Current objective (what are we building?): ');
      if (input.trim()) objective = input.trim();
    }

    // Step 5: Get OpenAI key
    let openaiKey = process.env.OPENAI_API_KEY || '';
    if (!openaiKey && !options.yes) {
      openaiKey = await prompt('OpenAI API key (sk-...): ');
    }

    // Step 6: Create config
    const config: AegisConfig = {
      projectId: `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      projectName,
      openaiApiKey: openaiKey || undefined,
      tier: 'free',
      watchPaths: ['.'],
      ignorePaths: [],
      relay: { port: 7734, enabled: true },
      vibe: { screenshotDir: '.aegis/screenshots' },
    };

    const configPath = path.join(projectPath, CONFIG_FILE);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Step 7: Write .env template
    const envPath = path.join(projectPath, ENV_FILE);
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, [
        `# Aegis Environment Variables`,
        `DATABASE_URL="file:.aegis/aegis.db"`,
        `OPENAI_API_KEY="${openaiKey}"`,
        `STRIPE_SECRET_KEY=""`,
        `STRIPE_WEBHOOK_SECRET=""`,
        `STRIPE_PRO_PRICE_ID=""`,
      ].join('\n'));
    }

    // Step 8: Initialize state
    const stateManager = new StateManager(projectPath);
    stateManager.setObjective(objective);

    // Step 9: Auto-detect tech stack from package.json
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
        const stack: string[] = [];
        if (deps.includes('next')) stack.push('Next.js');
        if (deps.includes('react')) stack.push('React');
        if (deps.includes('typescript') || fs.existsSync(path.join(projectPath, 'tsconfig.json'))) stack.push('TypeScript');
        if (deps.includes('tailwindcss')) stack.push('Tailwind CSS');
        if (deps.includes('prisma')) stack.push('Prisma');
        if (deps.includes('express')) stack.push('Express');
        if (deps.includes('@prisma/client')) stack.push('SQLite/Prisma');
        if (stack.length > 0) stateManager.updateTechStack(stack);
      } catch { /* ignore */ }
    }

    // Step 10: Update .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    const gitignoreAdditions = [
      '\n# Aegis',
      '.aegis/*.db',
      '.aegis/*.db-journal',
      '.aegis/screenshots/',
      '.aegis/.env',
    ].join('\n');

    if (fs.existsSync(gitignorePath)) {
      const existing = fs.readFileSync(gitignorePath, 'utf-8');
      if (!existing.includes('.aegis')) {
        fs.appendFileSync(gitignorePath, gitignoreAdditions);
      }
    } else {
      fs.writeFileSync(gitignorePath, gitignoreAdditions);
    }

    // Done!
    console.log('\n✅ Aegis initialized successfully!\n');
    console.log('Files created:');
    console.log(`  .aegis/config.json   → Project configuration`);
    console.log(`  .aegis/.env          → Environment variables`);
    console.log(`  AEGIS_STATE.json     → Shared agent memory`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Add your OpenAI API key to .aegis/.env');
    console.log('  2. Run: aegis watch    → Start monitoring changes');
    console.log('  3. Run: aegis verify   → Check UI vibe');
    console.log('  4. Run: aegis status   → View agent sync status');
    console.log('');
  });
