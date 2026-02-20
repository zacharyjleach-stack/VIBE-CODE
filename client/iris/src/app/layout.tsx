import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/QueryProvider';
import { NeuralProvider } from '@/context/NeuralContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vibe Code — AI-Powered Development',
    template: '%s · Vibe Code',
  },
  description: 'Iris captures your vision. Aegis builds it. The agentic development platform.',
  keywords: ['AI development', 'agentic coding', 'vibe coding', 'Iris', 'Aegis'],
  authors: [{ name: 'Vibe Code' }],
  themeColor: '#09090b',
  metadataBase: new URL('https://vibecode.app'),
  openGraph: {
    title: 'Vibe Code — AI-Powered Development',
    description: 'Iris captures your vision. Aegis builds it.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#09090b] font-sans antialiased">
        <QueryProvider>
          <NeuralProvider>
            {children}
          </NeuralProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
