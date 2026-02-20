'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Send, Sparkles, Loader2, RotateCcw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVibeStore } from '@/store/vibeStore';
import { api } from '@/lib/api';
import { DeployButton } from './DeployButton';

const SUGGESTIONS = [
  'A SaaS dashboard with auth and billing',
  'A REST API with PostgreSQL and Docker',
  'A real-time chat app with WebSockets',
];

function renderContent(text: string) {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={key++} className="font-semibold text-[#fafafa]">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function ChatPanel() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = useVibeStore((state) => state.messages);
  const isTyping = useVibeStore((state) => state.isTyping);
  const sessionId = useVibeStore((state) => state.sessionId);
  const userIntent = useVibeStore((state) => state.userIntent);
  const confidenceScore = useVibeStore((state) => state.confidenceScore);
  const addMessage = useVibeStore((state) => state.addMessage);
  const setIsTyping = useVibeStore((state) => state.setIsTyping);
  const updateAgentStatus = useVibeStore((state) => state.updateAgentStatus);
  const setUserIntent = useVibeStore((state) => state.setUserIntent);
  const appendToIntent = useVibeStore((state) => state.appendToIntent);
  const updateTechStack = useVibeStore((state) => state.updateTechStack);
  const addConstraint = useVibeStore((state) => state.addConstraint);
  const updateStylePreferences = useVibeStore((state) => state.updateStylePreferences);
  const updateConfidence = useVibeStore((state) => state.updateConfidence);
  const getVibeContext = useVibeStore((state) => state.getVibeContext);
  const clearMessages = useVibeStore((state) => state.clearMessages);
  const initializeSession = useVibeStore((state) => state.initializeSession);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const captureVibe = useCallback(
    (message: string) => {
      const lowerMessage = message.toLowerCase();
      let confidenceBoost = 0;

      if (!userIntent && message.length > 20) {
        setUserIntent(message);
        confidenceBoost += 0.2;
      } else if (message.length > 10) {
        appendToIntent(message);
        confidenceBoost += 0.1;
      }

      const frontendPatterns: Record<string, string> = {
        react: 'React', 'next.js': 'Next.js', nextjs: 'Next.js',
        vue: 'Vue.js', angular: 'Angular', svelte: 'Svelte',
      };
      for (const [pattern, name] of Object.entries(frontendPatterns)) {
        if (lowerMessage.includes(pattern)) { updateTechStack({ frontend: { name } }); confidenceBoost += 0.1; break; }
      }

      const backendPatterns: Record<string, string> = {
        node: 'Node.js', express: 'Express', python: 'Python',
        django: 'Django', fastapi: 'FastAPI', 'go lang': 'Go', golang: 'Go', rust: 'Rust',
      };
      for (const [pattern, name] of Object.entries(backendPatterns)) {
        if (lowerMessage.includes(pattern)) { updateTechStack({ backend: { name } }); confidenceBoost += 0.1; break; }
      }

      const dbPatterns: Record<string, { type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis'; name: string }> = {
        postgres: { type: 'postgresql', name: 'PostgreSQL' }, postgresql: { type: 'postgresql', name: 'PostgreSQL' },
        mysql: { type: 'mysql', name: 'MySQL' }, mongodb: { type: 'mongodb', name: 'MongoDB' },
        mongo: { type: 'mongodb', name: 'MongoDB' }, sqlite: { type: 'sqlite', name: 'SQLite' },
        redis: { type: 'redis', name: 'Redis' },
      };
      for (const [pattern, db] of Object.entries(dbPatterns)) {
        if (lowerMessage.includes(pattern)) { updateTechStack({ database: db }); confidenceBoost += 0.1; break; }
      }

      const constraintPatterns = [
        { match: /must (be|have|support)/i, type: 'must-have' as const },
        { match: /should (be|have|support)/i, type: 'nice-to-have' as const },
        { match: /don't|avoid|no\s/i, type: 'avoid' as const },
      ];
      for (const { match, type } of constraintPatterns) {
        if (match.test(message)) { addConstraint({ type, description: message, category: 'other' }); confidenceBoost += 0.05; }
      }

      if (lowerMessage.includes('dark') || lowerMessage.includes('dark mode')) updateStylePreferences({ colorScheme: 'dark' });
      if (lowerMessage.includes('light') || lowerMessage.includes('light mode')) updateStylePreferences({ colorScheme: 'light' });
      if (lowerMessage.includes('minimal')) updateStylePreferences({ animations: 'minimal' });
      if (lowerMessage.includes('animated') || lowerMessage.includes('fancy')) updateStylePreferences({ animations: 'expressive' });

      updateConfidence(confidenceScore + confidenceBoost);
    },
    [userIntent, confidenceScore, setUserIntent, appendToIntent, updateTechStack, addConstraint, updateStylePreferences, updateConfidence]
  );

  const parseSwarmCommand = (message: string): { agentId: number; task: string } | null => {
    const match = message.match(/^(?:@|#|agent\s*)?(\d{1,2})\s+(.+)$/i);
    if (match) {
      const agentId = parseInt(match[1], 10);
      if (agentId >= 1 && agentId <= 16) return { agentId, task: match[2] };
    }
    return null;
  };

  const dispatchSwarmCommand = useCallback(async (agentId: number, task: string) => {
    updateAgentStatus(agentId, 'working', task, 10);
    try {
      const response = await fetch('/api/aegis/agents/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, task }),
      });
      const data = await response.json();
      addMessage({ role: 'system', content: `Agent #${agentId} assigned: "${task}"` });
      return data;
    } catch {
      addMessage({ role: 'system', content: `Agent #${agentId} assigned locally: "${task}" (Aegis offline)` });
    }
  }, [addMessage, updateAgentStatus]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const swarmCommand = parseSwarmCommand(trimmedInput);
    addMessage({ role: 'user', content: trimmedInput });
    setInputValue('');

    if (swarmCommand) { await dispatchSwarmCommand(swarmCommand.agentId, swarmCommand.task); return; }

    const rangeMatch = trimmedInput.match(/^(\d{1,2})-(\d{1,2})\s+(.+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const task = rangeMatch[3];
      if (start >= 1 && end <= 16 && start <= end) {
        for (let i = start; i <= end; i++) await dispatchSwarmCommand(i, task);
        return;
      }
    }

    captureVibe(trimmedInput);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const vibeContext = getVibeContext();
      const response = await api.chat(sessionId || '', trimmedInput, vibeContext);

      if (response.success && response.data) {
        if (response.data.vibeUpdates) {
          const updates = response.data.vibeUpdates;
          if (updates.techStack) updateTechStack(updates.techStack);
          if (updates.stylePreferences) updateStylePreferences(updates.stylePreferences);
        }
        addMessage({
          role: 'assistant',
          content: response.data.response,
          metadata: { suggestions: response.data.suggestions },
        });
      } else {
        addMessage({ role: 'assistant', content: generateLocalResponse(trimmedInput) });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({ role: 'assistant', content: generateLocalResponse(trimmedInput) });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [inputValue, isLoading, sessionId, addMessage, captureVibe, setIsTyping, getVibeContext, updateTechStack, updateStylePreferences, dispatchSwarmCommand]);

  const generateLocalResponse = (userMessage: string): string => {
    const vibeContext = getVibeContext();
    const parts: string[] = ["I've captured that in your project vibe. Here's what I understand so far:"];
    if (vibeContext.userIntent) parts.push(`\n\n**Your Vision:** ${vibeContext.userIntent.slice(0, 200)}${vibeContext.userIntent.length > 200 ? '...' : ''}`);
    if (vibeContext.techStack.frontend || vibeContext.techStack.backend) {
      parts.push('\n\n**Tech Stack:**');
      if (vibeContext.techStack.frontend) parts.push(`- Frontend: ${vibeContext.techStack.frontend.name}`);
      if (vibeContext.techStack.backend) parts.push(`- Backend: ${vibeContext.techStack.backend.name}`);
      if (vibeContext.techStack.database) parts.push(`- Database: ${vibeContext.techStack.database.name}`);
    }
    if (vibeContext.constraints.length > 0) parts.push(`\n\n**Constraints:** ${vibeContext.constraints.length} captured`);
    parts.push('\n\nTell me more about what you want to build, or click Deploy when ready!');
    return parts.join('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleClearChat = () => { clearMessages(); initializeSession(); };

  const confidenceColor = confidenceScore >= 0.7 ? '#22c55e' : confidenceScore >= 0.4 ? '#f59e0b' : '#52525b';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
            <span className="text-sm font-semibold text-[#fafafa]">Vibe Capture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#27272a] bg-[#18181b]">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: confidenceColor }} />
              <span className="text-[11px] text-[#71717a]">{Math.round(confidenceScore * 100)}% ready</span>
            </div>
            <button
              onClick={handleClearChat}
              className="p-1.5 text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272a] rounded-md transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center h-full gap-6 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <p className="text-sm font-medium text-[#a1a1aa]">Describe what you want to build</p>
              <p className="text-xs text-[#52525b] mt-1">Iris will capture your intent and hand off to Aegis</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInputValue(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-[#27272a] bg-[#18181b] text-[#71717a] hover:text-[#a1a1aa] hover:border-[#3f3f46] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={
                message.role === 'user'
                  ? 'msg-user ml-auto max-w-[85%]'
                  : message.role === 'assistant'
                  ? 'msg-assistant mr-auto max-w-[85%]'
                  : 'msg-system mx-auto text-center text-xs max-w-full'
              }
            >
              {message.role !== 'system' && (
                <div className="text-[10px] font-medium uppercase tracking-widest mb-1.5 opacity-50">
                  {message.role === 'user' ? 'You' : 'Iris'}
                </div>
              )}
              <div className="text-sm leading-relaxed">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={`mb-0.5 ${line.startsWith('-') ? 'pl-3' : ''}`}>
                    {renderContent(line) || <br />}
                  </p>
                ))}
              </div>
              {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {message.metadata.suggestions.map((s: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(s)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-[#27272a] bg-[#18181b] text-[#71717a] hover:text-[#a1a1aa] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="msg-assistant mr-auto max-w-[85%]"
          >
            <div className="text-[10px] font-medium uppercase tracking-widest mb-1.5 opacity-50">Iris</div>
            <div className="flex items-center gap-1 py-0.5">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-[#27272a]">
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app, or command agents: '1 build a login page'"
              className="input pr-10 resize-none min-h-[44px] max-h-[150px] text-sm"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                inputValue.trim() && !isLoading
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white'
                  : 'text-[#3f3f46] cursor-not-allowed'
              }`}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-1">
            <Zap className="w-3 h-3 text-[#3f3f46]" />
            <span className="text-[10px] text-[#52525b]">Swarm: <code className="text-[#71717a]">1 build auth</code> or <code className="text-[#71717a]">1-4 scaffold API</code></span>
          </div>

          <DeployButton />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
