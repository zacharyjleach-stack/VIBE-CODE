/**
 * OpenAIBridge - GPT-4o integration for diff analysis and instruction generation
 */

import OpenAI from 'openai';
import type { AgentType, DiffAnalysis } from '../types/index.js';

export class OpenAIBridge {
  private client: OpenAI;
  private model: string = 'gpt-4o-mini';
  private visionModel: string = 'gpt-4o';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Analyze a code diff and generate cross-agent context
   */
  async analyzeDiff(
    filePath: string,
    diff: string,
    currentContext: string
  ): Promise<DiffAnalysis> {
    const prompt = `You are Aegis, a code intelligence system that synchronizes AI coding agents.

Analyze this code change and provide structured context for other AI agents.

FILE: ${filePath}
DIFF:
${diff.slice(0, 3000)}

CURRENT PROJECT CONTEXT:
${currentContext.slice(0, 2000)}

Respond with a JSON object:
{
  "summary": "One sentence describing what changed",
  "affectedComponents": ["list", "of", "components"],
  "crossAgentInstructions": "Instructions for other AI agents about this change",
  "riskLevel": "low|medium|high",
  "suggestedNextSteps": ["next", "steps"]
}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content) as DiffAnalysis;
  }

  /**
   * Generate updated instructions for a specific agent
   */
  async generateAgentInstructions(
    agentType: AgentType,
    contextSummary: string,
    recentAnalysis: DiffAnalysis
  ): Promise<string> {
    const agentFormats: Record<string, string> = {
      cursor: 'a .cursorrules file (plain text rules for Cursor AI)',
      claude: 'a CLAUDE.md file (markdown instructions for Claude Code)',
      gemini: 'a JSON config for Gemini AI assistant',
    };

    const format = agentFormats[agentType] || 'a plain text instruction file';

    const prompt = `You are Aegis. Generate updated instructions for ${agentType.toUpperCase()} as ${format}.

PROJECT CONTEXT:
${contextSummary.slice(0, 2000)}

RECENT CHANGE ANALYSIS:
- Summary: ${recentAnalysis.summary}
- Risk Level: ${recentAnalysis.riskLevel}
- Instructions: ${recentAnalysis.crossAgentInstructions}

Generate concise, actionable instructions that keep this agent synchronized with the current project state. Include the critical context about recent changes.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.4,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Analyze a screenshot against a PRD for vibe checking
   */
  async analyzeScreenshot(
    screenshotBase64: string,
    prdDescription: string,
    currentObjective: string
  ): Promise<{
    vibeScore: number;
    passed: boolean;
    feedback: string;
    suggestions: string[];
  }> {
    const response = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${screenshotBase64}` },
            },
            {
              type: 'text',
              text: `You are Aegis Vibe Checker. Analyze this UI screenshot against the project requirements.

CURRENT OBJECTIVE: ${currentObjective}
PRD DESCRIPTION: ${prdDescription}

Score the UI from 0-100 on how well it matches the vibe/intent.
Respond with JSON:
{
  "vibeScore": 85,
  "passed": true,
  "feedback": "Overall assessment",
  "suggestions": ["specific", "improvements"]
}`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No vision response');

    return JSON.parse(content);
  }

  /**
   * Detect tech stack from file listing
   */
  async detectTechStack(fileList: string[], packageJsonContent?: string): Promise<string[]> {
    const prompt = `Analyze these project files and detect the tech stack.

FILES: ${fileList.slice(0, 50).join(', ')}
${packageJsonContent ? `PACKAGE.JSON: ${packageJsonContent.slice(0, 1000)}` : ''}

Return a JSON array of technologies detected. Example:
["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma"]`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.1,
    });

    try {
      const content = response.choices[0]?.message?.content;
      if (!content) return [];
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.technologies || [];
    } catch {
      return [];
    }
  }
}
