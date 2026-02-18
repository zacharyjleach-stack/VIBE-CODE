import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../App';

const AGENT_ICONS: Record<string, string> = {
  cursor: '🟢',
  claude: '🟣',
  gemini: '🟠',
  aegis: '⬡',
  unknown: '●',
};

interface Props { messages: ChatMessage[]; }

export function A2AChat({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="a2a-empty">
        <span>Waiting for agent activity...</span>
      </div>
    );
  }

  return (
    <div className="a2a-chat">
      {messages.map((msg, i) => (
        <div key={i} className="chat-message">
          <span className="chat-icon">{AGENT_ICONS[msg.from] || '●'}</span>
          <div className="chat-content">
            <span className="chat-from">{msg.from.toUpperCase()}</span>
            {msg.to && <span className="chat-to"> → {msg.to.toUpperCase()}</span>}
            <p className="chat-text">{msg.text}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
