/**
 * Iris Chat API Route
 *
 * Supports multiple LLM providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Ollama (local models)
 *
 * Set NEXT_PUBLIC_LLM_PROVIDER and corresponding API keys in .env.local
 */

import { NextRequest, NextResponse } from 'next/server';

// Types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  vibeContext?: {
    userIntent?: string;
    techStack?: Record<string, unknown>;
    constraints?: unknown[];
  };
  stream?: boolean;
}

// Provider configurations
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434/api/chat',
    model: process.env.OLLAMA_MODEL || 'llama3',
    apiKey: null, // Ollama doesn't need an API key
  },
};

// Get the active provider
const getProvider = () => {
  const providerName = (process.env.LLM_PROVIDER || 'demo').toLowerCase();

  if (providerName === 'demo') {
    return { name: 'demo', config: null };
  }

  const config = PROVIDERS[providerName as keyof typeof PROVIDERS];
  if (!config) {
    throw new Error(`Unknown LLM provider: ${providerName}`);
  }

  return { name: providerName, config };
};

// System prompt for Iris
const IRIS_SYSTEM_PROMPT = `You are Iris, a creative and adaptive AI assistant specialized in vibe coding. Your role is to:

1. **Capture the Vibe**: Understand the user's vision, mood, and intent for their project
2. **Offer Ideas**: Suggest creative approaches, architecture patterns, and technologies
3. **Guide Development**: Help users articulate their requirements clearly
4. **Connect the Dots**: Bridge user intent with technical implementation

You work alongside Aegis, a powerful code execution engine with 16 AI workers. When the user is ready, you'll hand off the "vibe context" to Aegis for implementation.

Be conversational, creative, and helpful. Ask clarifying questions to better understand the user's vision. When discussing tech choices, explain trade-offs clearly.

Current conversation context will be provided to help you understand what the user is building.`;

// Demo responses for when no API key is configured
const DEMO_RESPONSES = [
  "I love that idea! Let me help you flesh it out. What's the main user experience you're envisioning?",
  "Great choice on the tech stack! Would you like me to suggest some architecture patterns that work well with that setup?",
  "I can see the vision taking shape. Should we discuss the data model, or would you prefer to focus on the UI flow first?",
  "That's an interesting approach. Have you considered how this will scale? I have some ideas that might help.",
  "Perfect! I'm getting a clear picture of what you want. When you're ready, we can hand this off to Aegis for implementation.",
  "I understand you want something modern and responsive. Let me suggest some design patterns that could work well here.",
  "The vibe I'm getting is clean, minimal, but powerful. Does that match what you're thinking?",
  "Excellent progress! Your tech stack is solid. Should we add any monitoring or analytics capabilities?",
];

// Handle demo mode
async function handleDemoMode(messages: ChatMessage[]): Promise<string> {
  // Simulate thinking delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

  // Context-aware responses
  if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
    return "Hey there! I'm Iris, your creative coding companion. I'm here to help capture the vibe of your project and turn your ideas into reality. What are we building today?";
  }

  if (lastMessage.includes('help') || lastMessage.includes('what can you do')) {
    return "I'm here to help you capture your project's vibe! Tell me about:\n\n• **What** you want to build\n• **Who** it's for\n• **How** it should feel\n\nOnce we nail down the vision, I'll hand it off to Aegis and our 16 AI workers to bring it to life. So, what's on your mind?";
  }

  if (lastMessage.includes('react') || lastMessage.includes('next') || lastMessage.includes('frontend')) {
    return "Nice! React/Next.js is a solid choice for modern frontends. Are you thinking of a specific design system? I'm partial to Tailwind with some glassmorphism effects, but we could go with Material UI, Chakra, or something custom. What vibe are you going for?";
  }

  if (lastMessage.includes('backend') || lastMessage.includes('api') || lastMessage.includes('server')) {
    return "For the backend, we have lots of options! Node.js/Express is reliable, but there's also Fastify for speed, or we could go with Python/FastAPI if you need heavy data processing. What kind of data and traffic are we expecting?";
  }

  if (lastMessage.includes('database') || lastMessage.includes('data')) {
    return "Databases are crucial! PostgreSQL is my go-to for relational data, MongoDB for flexible documents, or Redis for blazing-fast caching. Some projects even combine multiple databases. What kind of data will your app handle?";
  }

  if (lastMessage.includes('deploy') || lastMessage.includes('aegis') || lastMessage.includes('build')) {
    return "Ready to deploy to Aegis? Once you hit that deploy button, our swarm of 16 AI workers will take your vibe context and transform it into working code. Make sure you've filled in the key details about your tech stack and requirements. Should I review what we have so far?";
  }

  // Random contextual response
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}

// Call OpenAI API
async function callOpenAI(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const config = PROVIDERS.openai;

  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

// Call Anthropic API
async function callAnthropic(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const config = PROVIDERS.anthropic;

  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages format for Anthropic
  const anthropicMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: anthropicMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.content[0]?.text || 'No response generated';
}

// Call Ollama API
async function callOllama(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const config = PROVIDERS.ollama;

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: ollamaMessages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content || 'No response generated';
}

// Build context-aware system prompt
function buildSystemPrompt(vibeContext?: ChatRequest['vibeContext']): string {
  let contextInfo = '';

  if (vibeContext) {
    if (vibeContext.userIntent) {
      contextInfo += `\n\nCurrent Project Intent: ${vibeContext.userIntent}`;
    }
    if (vibeContext.techStack && Object.keys(vibeContext.techStack).length > 0) {
      contextInfo += `\n\nSelected Tech Stack: ${JSON.stringify(vibeContext.techStack, null, 2)}`;
    }
    if (vibeContext.constraints && vibeContext.constraints.length > 0) {
      contextInfo += `\n\nProject Constraints: ${JSON.stringify(vibeContext.constraints, null, 2)}`;
    }
  }

  return IRIS_SYSTEM_PROMPT + contextInfo;
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, vibeContext, stream = false } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const provider = getProvider();
    const systemPrompt = buildSystemPrompt(vibeContext);

    let response: string;

    switch (provider.name) {
      case 'openai':
        response = await callOpenAI(messages, systemPrompt);
        break;
      case 'anthropic':
        response = await callAnthropic(messages, systemPrompt);
        break;
      case 'ollama':
        response = await callOllama(messages, systemPrompt);
        break;
      case 'demo':
      default:
        response = await handleDemoMode(messages);
        break;
    }

    return NextResponse.json({
      response,
      provider: provider.name,
    });

  } catch (error) {
    console.error('Chat API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Fall back to demo mode on error
    return NextResponse.json({
      response: "I'm having trouble connecting to my brain right now, but I'm still here! Tell me about your project and I'll do my best to help capture the vibe.",
      provider: 'demo',
      error: message,
    });
  }
}

// Health check
export async function GET() {
  const provider = getProvider();

  return NextResponse.json({
    status: 'ok',
    provider: provider.name,
    configured: provider.name !== 'demo',
  });
}
