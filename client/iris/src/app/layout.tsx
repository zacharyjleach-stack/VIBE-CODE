import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Iris | Vibe Coding Platform',
  description: 'Transform your ideas into production-ready applications with AI-powered development',
  keywords: ['AI', 'coding', 'development', 'vibe coding', 'automation'],
  authors: [{ name: 'Vibe Code Team' }],
  themeColor: '#6366f1',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-dark-950 font-sans">
        <QueryProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl z-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris-500 to-iris-700 flex items-center justify-center shadow-lg shadow-iris-600/25">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-dark-50">Iris</h1>
                  <p className="text-xs text-dark-400">Vibe Coding Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-dark-300">Connected to Aegis</span>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
