Add AI/LLM capabilities to the application.

What to build: $ARGUMENTS

**OpenAI setup:**
```bash
npm install openai ai
```

```ts
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat completion
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
});

// Streaming with Vercel AI SDK
import { OpenAIStream, StreamingTextResponse } from 'ai';
const stream = OpenAIStream(response);
return new StreamingTextResponse(stream);
```

**Anthropic setup:**
```bash
npm install @anthropic-ai/sdk
```

```ts
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
```

**Vercel AI SDK (unified interface):**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

```ts
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Hello!',
});
```

**Patterns:**
- Rate limiting with upstash/ratelimit
- Streaming responses to the frontend
- Function calling / tool use
- Embeddings for semantic search
- Token counting for cost estimation

Build the specific AI feature with proper error handling and streaming support.
