/**
 * aegis upgrade - Open billing page and show current token status
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import https from 'https';
import type { AegisConfig } from '../../types/index.js';

const AEGIS_APP_URL = process.env.AEGIS_APP_URL || 'https://aegissolutions.co.uk';
const BILLING_URL = `${AEGIS_APP_URL}/billing`;

function openBrowser(url: string): void {
  const { exec } = require('child_process');
  const platform = process.platform;

  if (platform === 'darwin') {
    exec(`open "${url}"`);
  } else if (platform === 'win32') {
    exec(`start "" "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

function checkTokenBalance(apiKey: string, appUrl: string): Promise<{ balance: number; plan: string; allowed: boolean } | null> {
  return new Promise((resolve) => {
    const url = new URL(`${appUrl}/api/verify`);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: { 'x-api-key': apiKey },
        timeout: 5000,
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
    req.end();
  });
}

export const upgradeCommand = new Command('upgrade')
  .description('View pricing and upgrade your Aegis plan')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--status', 'Show current token balance only (no browser)')
  .action(async (options) => {
    const projectPath = path.resolve(options.path);

    // Load config
    const configPath = path.join(projectPath, '.aegis/config.json');
    let config: AegisConfig | null = null;
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AegisConfig;
    }

    // Load env
    const envPath = path.join(projectPath, '.aegis/.env');
    const env: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
        }
      }
    }

    const apiKey = env.AEGIS_API_KEY || process.env.AEGIS_API_KEY || '';
    const appUrl = env.AEGIS_APP_URL || process.env.AEGIS_APP_URL || AEGIS_APP_URL;

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║          AEGIS — UPGRADE YOUR PLAN        ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    // Show current status if API key available
    if (apiKey) {
      console.log('  Checking your account...');
      const status = await checkTokenBalance(apiKey, appUrl);

      if (status) {
        const planLabel = status.plan === 'lifetime' ? '∞ LIFETIME' : status.plan.toUpperCase();
        const balanceStr = status.plan === 'lifetime' ? 'Unlimited' : `${status.balance.toLocaleString()} tokens`;

        console.log(`\n  Current Plan:    ${planLabel}`);
        console.log(`  Token Balance:   ${balanceStr}`);

        if (status.balance <= 0 && status.plan === 'free') {
          console.log('\n  ⚠️  TRIAL EXPIRED — You\'ve used all 5,000 free tokens');
          console.log('  AI actions are currently blocked.');
        } else if (status.balance <= 500 && status.plan === 'free') {
          console.log(`\n  ⚠️  Low balance — ${status.balance} tokens remaining`);
        }
      } else {
        console.log('  (Could not reach Aegis server — offline mode)');
      }
    } else {
      console.log('  No API key found in .aegis/.env');
      console.log('  Current tier:', config?.tier || 'free (local only)');
    }

    console.log('\n  ─────────────────────────────────────────\n');
    console.log('  PRICING\n');
    console.log('  Free         £0      5,000 tokens — local sync, basic checks');
    console.log('  Pro          £20/mo  Unlimited    — HUD, Nexus, all features');
    console.log('  Lifetime     £550    ∞ Forever    — everything + Discord access');
    console.log('\n  ─────────────────────────────────────────\n');

    if (options.status) {
      console.log(`  Billing page: ${BILLING_URL}\n`);
      return;
    }

    console.log(`  Opening: ${BILLING_URL}`);
    console.log('  (Press Ctrl+C to cancel)\n');

    try {
      openBrowser(BILLING_URL);
    } catch {
      console.log(`  Could not open browser. Visit: ${BILLING_URL}\n`);
    }
  });
