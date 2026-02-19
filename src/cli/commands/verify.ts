/**
 * aegis verify - Run visual vibe check using Playwright + GPT-4o Vision
 * Token Sentry: costs 100 tokens per vibe check
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { VibeChecker } from '../../guard/VibeChecker.js';
import { StateManager } from '../../core/StateManager.js';
import type { AegisConfig } from '../../types/index.js';

const DEFAULT_AEGIS_APP_URL = 'https://aegissolutions.co.uk';

interface SentryResponse {
  allowed: boolean;
  balance?: number;
  tokensUsed?: number;
  message?: string;
  upgradeUrl?: string;
}

function callTokenSentry(apiKey: string, action: string, appUrl: string): Promise<SentryResponse | null> {
  return new Promise((resolve) => {
    const url = new URL(`${appUrl}/api/verify`);
    const body = JSON.stringify({ apiKey, action });
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

export const verifyCommand = new Command('verify')
  .description('Run a visual vibe check on your UI using GPT-4o Vision')
  .argument('<url>', 'URL to check (e.g. http://localhost:3000)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--prd <prd>', 'Path to PRD file for reference')
  .option('--routes <routes>', 'Comma-separated routes to check', '/')
  .option('--skip-sentry', 'Skip Token Sentry check (offline mode)')
  .action(async (url, options) => {
    const projectPath = path.resolve(options.path);

    // Load env
    const envPath = path.join(projectPath, '.aegis/.env');
    const env: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^"|"$/g, '');
          if (!process.env[key]) process.env[key] = value;
          env[key] = value;
        }
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (!openaiKey) {
      console.error('❌ OpenAI API key required for vibe check. Add to .aegis/.env');
      process.exit(1);
    }

    // Load config
    const configPath = path.join(projectPath, '.aegis/config.json');
    let config: AegisConfig | null = null;
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AegisConfig;
    }

    // ── Token Sentry Check ────────────────────────────────────────
    const apiKey = env.AEGIS_API_KEY || process.env.AEGIS_API_KEY || '';
    const appUrl = env.AEGIS_APP_URL || process.env.AEGIS_APP_URL || DEFAULT_AEGIS_APP_URL;

    if (apiKey && !options.skipSentry) {
      process.stdout.write('  ⬡ Token Sentry checking access... ');
      const sentry = await callTokenSentry(apiKey, 'vibe_check', appUrl);

      if (sentry === null) {
        // Network error — allow offline but warn
        console.log('⚠️  (offline — running without token check)');
      } else if (!sentry.allowed) {
        console.log('❌ BLOCKED\n');
        console.log('╔═══════════════════════════════════════════╗');
        console.log('║           TRIAL EXPIRED                   ║');
        console.log('╠═══════════════════════════════════════════╣');
        console.log('║  You have 0 tokens remaining.             ║');
        console.log('║  Vibe Checks cost 100 tokens each.        ║');
        console.log('║                                           ║');
        console.log('║  Upgrade to continue:                     ║');
        console.log(`║  ${(sentry.upgradeUrl || `${appUrl}/billing`).padEnd(41)}║`);
        console.log('║                                           ║');
        console.log('║  Run: aegis upgrade                       ║');
        console.log('╚═══════════════════════════════════════════╝\n');
        process.exit(1);
      } else {
        console.log(`✅ Allowed  (balance: ${(sentry.balance ?? 0).toLocaleString()} tokens)`);
      }
    } else if (!apiKey && !options.skipSentry) {
      console.log('  ⚠️  No AEGIS_API_KEY found — running without Token Sentry');
      console.log('     Add your key to .aegis/.env to enable access control\n');
    }
    // ─────────────────────────────────────────────────────────────

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
