import { NextRequest, NextResponse } from 'next/server';

// Types
interface VibeContext {
  sessionId: string | null;
  userIntent: string;
  techStack: {
    frontend?: { name: string; version?: string };
    backend?: { name: string; version?: string };
    database?: { type: string; name: string };
    additionalServices?: string[];
  };
  constraints: Array<{
    type: 'must-have' | 'nice-to-have' | 'avoid';
    description: string;
    category: string;
  }>;
  stylePreferences: {
    colorScheme?: 'light' | 'dark' | 'system';
    animations?: 'minimal' | 'moderate' | 'expressive';
  };
}

interface ChatRequest {
  sessionId: string;
  message: string;
  vibeContext: VibeContext;
}

interface ChatResponse {
  response: string;
  vibeUpdates?: Partial<VibeContext>;
  suggestions?: string[];
}

// Iris system prompt - defines her personality and behavior
const IRIS_SYSTEM_PROMPT = `You are Iris, a creative and friendly AI assistant for the Vibe Coding Platform. Your role is to help users capture their vision for software projects through natural conversation.

## Your Personality
- Friendly, creative, and encouraging
- Ask clarifying questions to understand what the user wants
- Offer alternatives and suggestions ("Have you considered...?")
- Explain trade-offs clearly when discussing technical choices
- Be concise but helpful - users are here to build things quickly

## Your Capabilities
1. **Vibe Capture**: Understand what the user wants to build through conversation
2. **Tech Stack Recommendations**: Suggest appropriate technologies based on requirements
3. **Idea Generation**: Proactively suggest features, architectures, and improvements
4. **Trade-off Analysis**: Help users understand pros/cons of different approaches

## Response Guidelines
- Keep responses focused and actionable (2-4 paragraphs max)
- When you detect technology preferences, acknowledge them
- Suggest next steps or ask follow-up questions
- If the user's idea is vague, ask specific questions to clarify
- When the vision is clear enough, encourage them to use the Deploy button

## Tech Stack Detection
When users mention technologies, extract and acknowledge:
- Frontend: React, Next.js, Vue, Angular, Svelte
- Backend: Node.js, Express, Python, Django, FastAPI, Go, Rust
- Database: PostgreSQL, MySQL, MongoDB, SQLite, Redis
- Infrastructure: Docker, Kubernetes, AWS, Vercel, Netlify

## Important
- Never generate code directly - that's Aegis's job
- Focus on understanding requirements and refining the vision
- Be excited about helping bring their ideas to life!`;

// Build context from vibe state
function buildVibeContextSummary(vibeContext: VibeContext): string {
  const parts: string[] = [];

  if (vibeContext.userIntent) {
    parts.push(`Current understanding: ${vibeContext.userIntent}`);
  }

  const { techStack } = vibeContext;
  if (techStack.frontend || techStack.backend || techStack.database) {
    const stack: string[] = [];
    if (techStack.frontend) stack.push(`Frontend: ${techStack.frontend.name}`);
    if (techStack.backend) stack.push(`Backend: ${techStack.backend.name}`);
    if (techStack.database) stack.push(`Database: ${techStack.database.name}`);
    parts.push(`Tech stack so far: ${stack.join(', ')}`);
  }

  if (vibeContext.constraints.length > 0) {
    const constraints = vibeContext.constraints
      .map(c => `${c.type}: ${c.description}`)
      .slice(0, 5)
      .join('; ');
    parts.push(`Constraints: ${constraints}`);
  }

  return parts.length > 0
    ? `\n\n[Current Vibe Context]\n${parts.join('\n')}`
    : '';
}

// Extract vibe updates from AI response
function extractVibeUpdates(response: string, message: string): Partial<VibeContext> | undefined {
  const updates: Partial<VibeContext> = {};
  const lowerResponse = (response + ' ' + message).toLowerCase();

  // Detect frontend frameworks mentioned in conversation
  const frontendMap: Record<string, string> = {
    'next.js': 'Next.js',
    'nextjs': 'Next.js',
    'react': 'React',
    'vue': 'Vue.js',
    'angular': 'Angular',
    'svelte': 'Svelte',
  };

  for (const [pattern, name] of Object.entries(frontendMap)) {
    if (lowerResponse.includes(pattern)) {
      updates.techStack = { ...updates.techStack, frontend: { name } };
      break;
    }
  }

  // Detect backend frameworks
  const backendMap: Record<string, string> = {
    'fastapi': 'FastAPI',
    'django': 'Django',
    'express': 'Express',
    'node.js': 'Node.js',
    'nodejs': 'Node.js',
    'python': 'Python',
    'go': 'Go',
    'rust': 'Rust',
  };

  for (const [pattern, name] of Object.entries(backendMap)) {
    if (lowerResponse.includes(pattern)) {
      updates.techStack = { ...updates.techStack, backend: { name } };
      break;
    }
  }

  // Detect databases
  const dbMap: Record<string, { type: string; name: string }> = {
    'postgresql': { type: 'postgresql', name: 'PostgreSQL' },
    'postgres': { type: 'postgresql', name: 'PostgreSQL' },
    'mysql': { type: 'mysql', name: 'MySQL' },
    'mongodb': { type: 'mongodb', name: 'MongoDB' },
    'mongo': { type: 'mongodb', name: 'MongoDB' },
    'sqlite': { type: 'sqlite', name: 'SQLite' },
    'redis': { type: 'redis', name: 'Redis' },
  };

  for (const [pattern, db] of Object.entries(dbMap)) {
    if (lowerResponse.includes(pattern)) {
      updates.techStack = { ...updates.techStack, database: db };
      break;
    }
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}

// Generate contextual suggestions based on conversation
function generateSuggestions(response: string, vibeContext: VibeContext): string[] {
  const suggestions: string[] = [];

  // If no tech stack yet, suggest asking about it
  if (!vibeContext.techStack.frontend && !vibeContext.techStack.backend) {
    suggestions.push('What tech stack should I use?');
  }

  // If intent is short, suggest elaborating
  if (vibeContext.userIntent.length < 50) {
    suggestions.push('Let me describe the main features');
  }

  // Generic helpful suggestions
  if (suggestions.length < 2) {
    suggestions.push('What are the must-have features?');
  }

  if (vibeContext.userIntent.length > 100 && suggestions.length < 3) {
    suggestions.push("I'm ready to build this!");
  }

  return suggestions.slice(0, 3);
}

// Call Anthropic API
async function callAnthropic(
  message: string,
  vibeContextSummary: string,
  conversationHistory: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: IRIS_SYSTEM_PROMPT + vibeContextSummary,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Call OpenAI API (fallback)
async function callOpenAI(
  message: string,
  vibeContextSummary: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: IRIS_SYSTEM_PROMPT + vibeContextSummary,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body: ChatRequest = await request.json();
    const { message, vibeContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context summary for the AI
    const vibeContextSummary = buildVibeContextSummary(vibeContext);

    let aiResponse: string;

    // Try Anthropic first, then OpenAI as fallback
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasAnthropic && !hasOpenAI) {
      // No API keys configured - return helpful error
      return NextResponse.json({
        response: "I'm not fully connected yet! To enable intelligent responses, please add an `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to your `.env.local` file.\n\nIn the meantime, I've captured your message in the vibe context. Tell me more about what you want to build!",
        suggestions: ['How do I add an API key?', 'What can you help me build?'],
      });
    }

    try {
      if (hasAnthropic) {
        aiResponse = await callAnthropic(message, vibeContextSummary, '');
      } else {
        aiResponse = await callOpenAI(message, vibeContextSummary);
      }
    } catch (error) {
      console.error('Primary LLM failed, trying fallback:', error);

      // Try fallback if primary fails
      if (hasAnthropic && hasOpenAI) {
        try {
          aiResponse = await callOpenAI(message, vibeContextSummary);
        } catch (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

    // Extract any tech stack updates from the conversation
    const vibeUpdates = extractVibeUpdates(aiResponse, message);

    // Generate contextual suggestions
    const suggestions = generateSuggestions(aiResponse, vibeContext);

    return NextResponse.json({
      response: aiResponse,
      vibeUpdates,
      suggestions,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
