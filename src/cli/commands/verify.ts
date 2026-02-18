/**
 * aegis verify - Run visual vibe check using Playwright + GPT-4o Vision
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { VibeChecker } from '../../guard/VibeChecker.js';
import { StateManager } from '../../core/StateManager.js';
import type { AegisConfig } from '../../types/index.js';

export const verifyCommand = new Command('verify')
  .description('Run a visual vibe check on your UI using GPT-4o Vision')
  .argument('<url>', 'URL to check (e.g. http://localhost:3000)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--prd <prd>', 'Path to PRD file for reference')
  .option('--routes <routes>', 'Comma-separated routes to check', '/')
  .action(async (url, options) => {
    const projectPath = path.resolve(options.path);

    // Load env
    const envPath = path.join(projectPath, '.aegis/.env');
    if (fs.existsSync(envPath)) {
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

    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (!openaiKey) {
      console.error('❌ OpenAI API key required for vibe check. Add to .aegis/.env');
      process.exit(1);
    }

    // Check tier
    const configPath = path.join(projectPath, '.aegis/config.json');
    let config: AegisConfig | null = null;
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AegisConfig;
    }

    if (config?.tier === 'free') {
      console.log('⚠️  Visual Vibe Checks require Pro tier ($20/mo)');
      console.log('   Upgrade at: aegis upgrade');
      console.log('   Running basic check anyway (limited)...\n');
    }

    // Load state
    const stateManager = new StateManager(projectPath);
    const state = stateManager.getState();

    // Load PRD
    let prdDescription = state.currentObjective;
    if (options.prd && fs.existsSync(options.prd)) {
      prdDescription = fs.readFileSync(options.prd, 'utf-8').slice(0, 2000);
    }

    const screenshotDir = path.join(projectPath, '.aegis/screenshots');
    const checker = new VibeChecker(openaiKey, screenshotDir);

    const routes = options.routes.split(',').map((r: string) => r.trim());

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║       AEGIS VIBE CHECK - VISUAL MODE      ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    const results = await checker.checkMultipleRoutes(
      url,
      routes,
      prdDescription,
      state.currentObjective
    );

    // Summary
    console.log('\n═══════════════ VIBE CHECK RESULTS ═══════════════\n');
    let totalScore = 0;
    let count = 0;

    for (const [route, result] of Object.entries(results)) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${route}`);
      console.log(`   Score:    ${result.vibeScore}/100`);
      console.log(`   Feedback: ${result.feedback}`);
      if (result.suggestions.length > 0) {
        console.log(`   Fix:      ${result.suggestions[0]}`);
      }
      console.log(`   Screenshot: ${result.screenshotPath}\n`);
      totalScore += result.vibeScore;
      count++;
    }

    const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
    const overallPass = avgScore >= 70;

    console.log(`═══════════════════════════════════════════════════`);
    console.log(`Overall Vibe Score: ${avgScore}/100 ${overallPass ? '✅ PASSING' : '❌ NEEDS WORK'}`);
    console.log(`═══════════════════════════════════════════════════\n`);

    stateManager.updateVibeCheck(overallPass ? 'pass' : 'fail');
  });
