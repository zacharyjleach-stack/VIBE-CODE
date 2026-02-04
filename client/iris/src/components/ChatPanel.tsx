'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Send, Sparkles, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { useVibeStore } from '@/store/vibeStore';
import { api } from '@/lib/api';
import { DeployButton } from './DeployButton';
import { clsx } from 'clsx';

/**
 * ChatPanel Component
 * Chat interface for capturing user intent and vibe
 * Includes message history, input field, and vibe capture logic
 */
export function ChatPanel() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Store state and actions
  const messages = useVibeStore((state) => state.messages);
  const isTyping = useVibeStore((state) => state.isTyping);
  const sessionId = useVibeStore((state) => state.sessionId);
  const userIntent = useVibeStore((state) => state.userIntent);
  const confidenceScore = useVibeStore((state) => state.confidenceScore);
  const addMessage = useVibeStore((state) => state.addMessage);
  const setIsTyping = useVibeStore((state) => state.setIsTyping);
  const setUserIntent = useVibeStore((state) => state.setUserIntent);
  const appendToIntent = useVibeStore((state) => state.appendToIntent);
  const updateTechStack = useVibeStore((state) => state.updateTechStack);
  const addConstraint = useVibeStore((state) => state.addConstraint);
  const updateStylePreferences = useVibeStore((state) => state.updateStylePreferences);
  const updateConfidence = useVibeStore((state) => state.updateConfidence);
  const getVibeContext = useVibeStore((state) => state.getVibeContext);
  const clearMessages = useVibeStore((state) => state.clearMessages);
  const initializeSession = useVibeStore((state) => state.initializeSession);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Vibe capture logic - parse user message for intent signals
  const captureVibe = useCallback(
    (message: string) => {
      const lowerMessage = message.toLowerCase();
      let confidenceBoost = 0;

      // Capture user intent
      if (!userIntent && message.length > 20) {
        setUserIntent(message);
        confidenceBoost += 0.2;
      } else if (message.length > 10) {
        appendToIntent(message);
        confidenceBoost += 0.1;
      }

      // Detect frontend frameworks
      const frontendPatterns: Record<string, string> = {
        react: 'React',
        'next.js': 'Next.js',
        nextjs: 'Next.js',
        vue: 'Vue.js',
        angular: 'Angular',
        svelte: 'Svelte',
      };

      for (const [pattern, name] of Object.entries(frontendPatterns)) {
        if (lowerMessage.includes(pattern)) {
          updateTechStack({ frontend: { name } });
          confidenceBoost += 0.1;
          break;
        }
      }

      // Detect backend frameworks
      const backendPatterns: Record<string, string> = {
        node: 'Node.js',
        express: 'Express',
        python: 'Python',
        django: 'Django',
        fastapi: 'FastAPI',
        'go lang': 'Go',
        golang: 'Go',
        rust: 'Rust',
      };

      for (const [pattern, name] of Object.entries(backendPatterns)) {
        if (lowerMessage.includes(pattern)) {
          updateTechStack({ backend: { name } });
          confidenceBoost += 0.1;
          break;
        }
      }

      // Detect databases
      const dbPatterns: Record<string, { type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis'; name: string }> = {
        postgres: { type: 'postgresql', name: 'PostgreSQL' },
        postgresql: { type: 'postgresql', name: 'PostgreSQL' },
        mysql: { type: 'mysql', name: 'MySQL' },
        mongodb: { type: 'mongodb', name: 'MongoDB' },
        mongo: { type: 'mongodb', name: 'MongoDB' },
        sqlite: { type: 'sqlite', name: 'SQLite' },
        redis: { type: 'redis', name: 'Redis' },
      };

      for (const [pattern, db] of Object.entries(dbPatterns)) {
        if (lowerMessage.includes(pattern)) {
          updateTechStack({ database: db });
          confidenceBoost += 0.1;
          break;
        }
      }

      // Detect constraints
      const constraintPatterns = [
        { match: /must (be|have|support)/i, type: 'must-have' as const },
        { match: /should (be|have|support)/i, type: 'nice-to-have' as const },
        { match: /don't|avoid|no\s/i, type: 'avoid' as const },
      ];

      for (const { match, type } of constraintPatterns) {
        if (match.test(message)) {
          addConstraint({
            type,
            description: message,
            category: 'other',
          });
          confidenceBoost += 0.05;
        }
      }

      // Detect style preferences
      if (lowerMessage.includes('dark') || lowerMessage.includes('dark mode')) {
        updateStylePreferences({ colorScheme: 'dark' });
      }
      if (lowerMessage.includes('light') || lowerMessage.includes('light mode')) {
        updateStylePreferences({ colorScheme: 'light' });
      }
      if (lowerMessage.includes('minimal')) {
        updateStylePreferences({ animations: 'minimal' });
      }
      if (lowerMessage.includes('animated') || lowerMessage.includes('fancy')) {
        updateStylePreferences({ animations: 'expressive' });
      }

      // Update confidence score
      updateConfidence(confidenceScore + confidenceBoost);
    },
    [
      userIntent,
      confidenceScore,
      setUserIntent,
      appendToIntent,
      updateTechStack,
      addConstraint,
      updateStylePreferences,
      updateConfidence,
    ]
  );

  // Send message to AI
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedInput,
    });

    // Capture vibe from message
    captureVibe(trimmedInput);

    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send to AI for response
      const vibeContext = getVibeContext();
      const response = await api.chat(sessionId || '', trimmedInput, vibeContext);

      if (response.success && response.data) {
        // Apply any vibe updates from AI
        if (response.data.vibeUpdates) {
          const updates = response.data.vibeUpdates;
          if (updates.techStack) {
            updateTechStack(updates.techStack);
          }
          if (updates.stylePreferences) {
            updateStylePreferences(updates.stylePreferences);
          }
        }

        // Add assistant response
        addMessage({
          role: 'assistant',
          content: response.data.response,
          metadata: {
            suggestions: response.data.suggestions,
          },
        });
      } else {
        // Fallback response if API fails
        addMessage({
          role: 'assistant',
          content: generateLocalResponse(trimmedInput),
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Generate local response on error
      addMessage({
        role: 'assistant',
        content: generateLocalResponse(trimmedInput),
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [
    inputValue,
    isLoading,
    sessionId,
    addMessage,
    captureVibe,
    setIsTyping,
    getVibeContext,
    updateTechStack,
    updateStylePreferences,
  ]);

  // Generate local fallback response
  const generateLocalResponse = (userMessage: string): string => {
    const vibeContext = getVibeContext();
    const parts: string[] = [];

    parts.push("I've captured that in your project vibe. Here's what I understand so far:");

    if (vibeContext.userIntent) {
      parts.push(`\n\n**Your Vision:** ${vibeContext.userIntent.slice(0, 200)}${vibeContext.userIntent.length > 200 ? '...' : ''}`);
    }

    if (vibeContext.techStack.frontend || vibeContext.techStack.backend) {
      parts.push('\n\n**Tech Stack:**');
      if (vibeContext.techStack.frontend) {
        parts.push(`- Frontend: ${vibeContext.techStack.frontend.name}`);
      }
      if (vibeContext.techStack.backend) {
        parts.push(`- Backend: ${vibeContext.techStack.backend.name}`);
      }
      if (vibeContext.techStack.database) {
        parts.push(`- Database: ${vibeContext.techStack.database.name}`);
      }
    }

    if (vibeContext.constraints.length > 0) {
      parts.push(`\n\n**Constraints:** ${vibeContext.constraints.length} captured`);
    }

    parts.push('\n\nTell me more about what you want to build, or click the Deploy button when ready!');

    return parts.join('');
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat and start fresh
  const handleClearChat = () => {
    clearMessages();
    initializeSession();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-dark-800 bg-dark-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-iris-400" />
            <h2 className="font-semibold text-dark-100">Vibe Capture</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Confidence indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-800 border border-dark-700">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    confidenceScore >= 0.7
                      ? '#10b981'
                      : confidenceScore >= 0.4
                      ? '#f59e0b'
                      : '#6b7280',
                }}
              />
              <span className="text-xs text-dark-400">
                {Math.round(confidenceScore * 100)}% Ready
              </span>
            </div>
            <button
              onClick={handleClearChat}
              className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'max-w-[85%] p-4 rounded-xl',
              message.role === 'user' && 'ml-auto message-user',
              message.role === 'assistant' && 'mr-auto message-assistant',
              message.role === 'system' && 'mx-auto text-center message-system text-sm'
            )}
          >
            {/* Message role indicator */}
            {message.role !== 'system' && (
              <div className="text-xs text-dark-500 mb-1 font-medium uppercase tracking-wider">
                {message.role === 'user' ? 'You' : 'Iris'}
              </div>
            )}

            {/* Message content with markdown-like styling */}
            <div className="prose prose-invert prose-sm max-w-none">
              {message.content.split('\n').map((line, i) => {
                // Handle bold text
                const boldRegex = /\*\*(.*?)\*\*/g;
                const parts = [];
                let lastIndex = 0;
                let match;

                while ((match = boldRegex.exec(line)) !== null) {
                  if (match.index > lastIndex) {
                    parts.push(line.slice(lastIndex, match.index));
                  }
                  parts.push(
                    <strong key={match.index} className="font-semibold text-dark-100">
                      {match[1]}
                    </strong>
                  );
                  lastIndex = match.index + match[0].length;
                }

                if (lastIndex < line.length) {
                  parts.push(line.slice(lastIndex));
                }

                return (
                  <p key={i} className={clsx('mb-1', line.startsWith('-') && 'pl-4')}>
                    {parts.length > 0 ? parts : line || <br />}
                  </p>
                );
              })}
            </div>

            {/* Suggestions */}
            {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.metadata.suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(suggestion)}
                    className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 p-4 max-w-[85%] mr-auto message-assistant rounded-xl">
            <div className="flex items-center gap-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span className="text-xs text-dark-500">Iris is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-dark-800 bg-dark-900/50">
        <div className="flex flex-col gap-3">
          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app idea... (Shift+Enter for new line)"
              className="input-field pr-12 resize-none min-h-[48px] max-h-[150px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={clsx(
                'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all',
                inputValue.trim() && !isLoading
                  ? 'bg-iris-600 hover:bg-iris-500 text-white'
                  : 'bg-dark-700 text-dark-500 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Deploy Button */}
          <DeployButton />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
