'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  url?: string;
}

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'github',
      name: 'GitHub',
      description: 'Push code, create PRs, manage repos',
      icon: <GitHubIcon />,
      connected: false,
      url: 'https://github.com',
    },
    {
      id: 'vscode',
      name: 'VS Code',
      description: 'Open workspace in VS Code',
      icon: <VSCodeIcon />,
      connected: false,
      url: 'vscode://vscode.git',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Deploy frontend automatically',
      icon: <VercelIcon />,
      connected: false,
      url: 'https://vercel.com',
    },
    {
      id: 'docker',
      name: 'Docker',
      description: 'Containerize and orchestrate services',
      icon: <DockerIcon />,
      connected: false,
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'Cache and message queue',
      icon: <RedisIcon />,
      connected: false,
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Database, auth, and storage',
      icon: <SupabaseIcon />,
      connected: false,
      url: 'https://supabase.com',
    },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#27272a] bg-[#18181b]">
        <div>
          <p className="text-xs font-semibold text-[#a1a1aa]">Integrations</p>
          <p className="text-[10px] text-[#52525b] mt-0.5">
            {connectedCount} of {integrations.length} connected
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#27272a]">
          <div className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-emerald-500' : 'bg-[#52525b]'}`} />
          <span className="text-[10px] text-[#71717a]">{connectedCount > 0 ? 'Active' : 'None'}</span>
        </div>
      </div>

      {/* Integration list */}
      <div className="space-y-1.5">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              integration.connected
                ? 'border-[#6d28d9]/30 bg-[#8b5cf6]/5'
                : 'border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  integration.connected ? 'bg-[#8b5cf6]/15 text-[#a78bfa]' : 'bg-[#27272a] text-[#52525b]'
                }`}
              >
                {integration.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#a1a1aa]">{integration.name}</span>
                  {integration.url && integration.connected && (
                    <a
                      href={integration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#52525b] hover:text-[#a78bfa] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-[#52525b]">{integration.description}</p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggleIntegration(integration.id)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                integration.connected ? 'bg-[#7c3aed]' : 'bg-[#27272a]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  integration.connected ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function VSCodeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.583 2.248l-5.28 4.96L7.52 3.584l-4.52 1.92v12.992l4.52 1.92 4.783-3.624 5.28 4.96L21 19.904V4.096l-3.417-1.848zM7.52 15.488L4.2 13.2V10.8l3.32-2.288v6.976zm5.28-1.488l-3.68 2.784V7.216l3.68 2.784v4zm5.2 2.4l-3.6-3.36V10.96l3.6-3.36v9.24z" />
    </svg>
  );
}

function VercelIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L24 22H0L12 1z" />
    </svg>
  );
}

function DockerIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.186.186 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.186.186 0 00-.185-.186H5.136a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.186.186 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" />
    </svg>
  );
}

function RedisIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.5 2.661l.54.997-1.797.644 2.409.218.748 1.246.467-1.397 2.326-.308-1.689-.657.588-1.08-1.658.667L10.5 2.661zM3.528 8.326l8.27 3.465 8.27-3.465M3.528 11.88l8.27 3.465 8.27-3.465M3.528 15.434l8.27 3.465 8.27-3.465" />
    </svg>
  );
}

function SupabaseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.7 21.8c-.4.5-1.3.2-1.3-.5V14h8.3c.8 0 1.3.9.8 1.6l-7.8 6.2zM10.3 2.2c.4-.5 1.3-.2 1.3.5V10H3.3c-.8 0-1.3-.9-.8-1.6l7.8-6.2z" />
    </svg>
  );
}

export default IntegrationsPanel;
