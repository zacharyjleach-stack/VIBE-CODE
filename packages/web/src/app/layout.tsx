import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aegis - Universal Agentic Bridge',
  description: 'Synchronize Cursor, Claude Code, and Gemini into one AI team. Never lose context. Never hallucinate conflicts.',
  openGraph: {
    title: 'Aegis - The Ghost in Your Machine',
    description: 'The universal bridge that makes your AI agents work as a team.',
    images: ['/og-image.png'],
  },
};

// Make Clerk optional for development without keys
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthWrapper({ children }: { children: React.ReactNode }) {
  if (hasClerkKey) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      <html lang="en">
        <body>{children}</body>
      </html>
    </AuthWrapper>
  );
}

// Export Clerk components for use in other pages
export { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton };
