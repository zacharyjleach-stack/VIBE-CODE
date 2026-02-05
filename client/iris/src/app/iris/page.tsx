'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ArrowLeft, Zap, Sparkles, Send, Loader2 } from 'lucide-react';
import { useNeural } from '@/context/NeuralContext';
import { ChatPanel } from '@/components/ChatPanel';
import { SplitPane } from '@/components/SplitPane';
import { useVibeStore } from '@/store/vibeStore';
import { clsx } from 'clsx';

/**
 * Iris Page - The Iris AI Chat Interface
 *
 * This is the main interface for capturing user intent and project "vibe".
 * Features:
 * - Chat interface with vibe capture logic
 * - Visualization panel for real-time feedback
 * - Handoff functionality to transfer context to Aegis
 */
export default function IrisPage() {
  const router = useRouter();
  const { initiateHandoff, isHandoffPending } = useNeural();
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);

  // Store state and actions
  const sessionId = useVibeStore((state) => state.sessionId);
  const userIntent = useVibeStore((state) => state.userIntent);
  const confidenceScore = useVibeStore((state) => state.confidenceScore);
  const techStack = useVibeStore((state) => state.techStack);
  const constraints = useVibeStore((state) => state.constraints);
  const initializeSession = useVibeStore((state) => state.initializeSession);
  const getVibeContext = useVibeStore((state) => state.getVibeContext);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId, initializeSession]);

  // Check if ready to handoff (has meaningful context)
  const isReadyForHandoff = userIntent.length > 10 && confidenceScore >= 0.3;

  /**
   * Handle "Build This" - Initiates handoff to Aegis
   * Gathers current vibe context and triggers the neural handoff
   */
  const handleBuildThis = useCallback(() => {
    if (isHandoffLoading || isHandoffPending) return;

    setIsHandoffLoading(true);

    try {
      const vibeContext = getVibeContext();

      // Prepare the handoff payload
      const handoffPayload = {
        userIntent: vibeContext.userIntent,
        techStack: {
          frontend: vibeContext.techStack.frontend?.name,
          backend: vibeContext.techStack.backend?.name,
          database: vibeContext.techStack.database?.name,
        },
        constraints: vibeContext.constraints.map((c) => c.description),
      };

      // Initiate the handoff to Aegis
      initiateHandoff(handoffPayload);
    } catch (error) {
      console.error('Handoff error:', error);
      setIsHandoffLoading(false);
    }
  }, [getVibeContext, initiateHandoff, isHandoffLoading, isHandoffPending]);

  // Navigate back to landing page
  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full bg-dark-950">
      {/* Iris Header with purple/pink gradient theme */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-iris-900/50 bg-gradient-to-r from-iris-950 via-dark-900 to-purple-950/50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Back button and Branding */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-iris-400 hover:text-iris-300 hover:bg-iris-900/30 transition-all duration-200"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              {/* Eye Icon with purple gradient */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-iris-600/30 animate-pulse-slow">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-iris-500 via-purple-500 to-pink-500 blur-lg opacity-30 -z-10" />
              </div>

              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-iris-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Iris
                </h1>
                <p className="text-xs text-iris-400/70">Vision Capture AI</p>
              </div>
            </div>
          </div>

          {/* Center: Context Status */}
          <div className="hidden md:flex items-center gap-4">
            {/* Confidence Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/50 border border-iris-800/50">
              <Sparkles className="w-4 h-4 text-iris-400" />
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-iris-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.round(confidenceScore * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-iris-300">
                  {Math.round(confidenceScore * 100)}% Vibe
                </span>
              </div>
            </div>

            {/* Tech Stack Pills */}
            {(techStack.frontend || techStack.backend) && (
              <div className="flex items-center gap-2">
                {techStack.frontend && (
                  <span className="px-2 py-1 text-xs rounded-md bg-iris-900/50 text-iris-300 border border-iris-800/50">
                    {techStack.frontend.name}
                  </span>
                )}
                {techStack.backend && (
                  <span className="px-2 py-1 text-xs rounded-md bg-purple-900/50 text-purple-300 border border-purple-800/50">
                    {techStack.backend.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Handoff Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBuildThis}
              disabled={!isReadyForHandoff || isHandoffLoading || isHandoffPending}
              className={clsx(
                'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300',
                isReadyForHandoff && !isHandoffLoading && !isHandoffPending
                  ? 'bg-gradient-to-r from-iris-600 via-purple-600 to-pink-600 hover:from-iris-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-iris-600/25 hover:shadow-iris-500/40 hover:scale-105'
                  : 'bg-dark-800 text-dark-400 cursor-not-allowed border border-dark-700'
              )}
              title={isReadyForHandoff ? 'Send your vision to Aegis for building' : 'Add more details to your project vision'}
            >
              {isHandoffLoading || isHandoffPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Handing off...</span>
                </>
              ) : (
                <>
                  <Zap className={clsx(
                    'w-4 h-4 transition-transform duration-300',
                    isReadyForHandoff && 'group-hover:rotate-12'
                  )} />
                  <span>Send to Aegis</span>
                  <Send className={clsx(
                    'w-4 h-4 transition-transform duration-300',
                    isReadyForHandoff && 'group-hover:translate-x-0.5'
                  )} />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Handoff Instruction Banner */}
      {!isReadyForHandoff && (
        <div className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-iris-900/30 via-purple-900/20 to-pink-900/30 border-b border-iris-800/30">
          <p className="text-center text-sm text-iris-300/80">
            <Sparkles className="w-4 h-4 inline-block mr-2 text-iris-400" />
            Tell me about your project idea. Once I capture your vibe, click <strong className="text-iris-300">"Send to Aegis"</strong> or type <strong className="text-iris-300">"Build this"</strong> to start building!
          </p>
        </div>
      )}

      {/* Main Content - Split Pane */}
      <main className="flex-1 overflow-hidden">
        <SplitPane />
      </main>

      {/* Floating Action Button for quick handoff (mobile-friendly) */}
      {isReadyForHandoff && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <button
            onClick={handleBuildThis}
            disabled={isHandoffLoading || isHandoffPending}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-iris-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-iris-600/40 hover:shadow-iris-500/60 transition-all duration-300 hover:scale-110"
            title="Send to Aegis"
          >
            {isHandoffLoading || isHandoffPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </button>
        </div>
      )}

      {/* Decorative gradient overlays */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-iris-900/10 to-transparent pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none -z-10" />
    </div>
  );
}
