/**
 * VibeChecker - Playwright + GPT Vision for UI verification
 */

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { OpenAIBridge } from '../brain/OpenAIBridge.js';
import type { VibeCheckResult } from '../types/index.js';

export class VibeChecker {
  private openAIBridge: OpenAIBridge;
  private screenshotDir: string;
  private browser: Browser | null = null;

  constructor(openaiApiKey: string, screenshotDir: string = '.aegis/screenshots') {
    this.openAIBridge = new OpenAIBridge(openaiApiKey);
    this.screenshotDir = screenshotDir;

    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  }

  async checkUrl(
    url: string,
    prdDescription: string,
    currentObjective: string
  ): Promise<VibeCheckResult> {
    console.log(`\n🎭 Running Vibe Check on: ${url}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      const timestamp = Date.now();
      const screenshotPath = path.join(this.screenshotDir, `vibe-check-${timestamp}.png`);

      await page.screenshot({ path: screenshotPath, fullPage: false });

      const screenshotBuffer = fs.readFileSync(screenshotPath);
      const base64 = screenshotBuffer.toString('base64');

      const analysis = await this.openAIBridge.analyzeScreenshot(
        base64,
        prdDescription,
        currentObjective
      );

      const result: VibeCheckResult = {
        passed: analysis.passed,
        screenshotPath,
        vibeScore: analysis.vibeScore,
        feedback: analysis.feedback,
        suggestions: analysis.suggestions,
      };

      console.log(`  Vibe Score: ${analysis.vibeScore}/100 ${analysis.passed ? '✓ PASS' : '✗ FAIL'}`);
      console.log(`  Feedback: ${analysis.feedback}`);

      return result;
    } finally {
      await browser.close();
    }
  }

  async checkMultipleRoutes(
    baseUrl: string,
    routes: string[],
    prdDescription: string,
    currentObjective: string
  ): Promise<Record<string, VibeCheckResult>> {
    const results: Record<string, VibeCheckResult> = {};

    for (const route of routes) {
      const url = `${baseUrl}${route}`;
      results[route] = await this.checkUrl(url, prdDescription, currentObjective);
    }

    return results;
  }
}
