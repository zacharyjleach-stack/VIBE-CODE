import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  VibeContext,
  TechStack,
  Constraint,
  StylePreferences,
  ChatMessage,
  AgentSlot,
  AgentStatus,
} from '@/types';

// ==================== Store State Interface ====================

interface VibeState {
  // Session
  sessionId: string | null;

  // Vibe Context
  userIntent: string;
  techStack: TechStack;
  constraints: Constraint[];
  stylePreferences: StylePreferences;
  contextVersion: number;
  confidenceScore: number;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;

  // Agent Status
  agents: AgentSlot[];

  // Handoff State
  currentJobId: string | null;
  handoffStatus: 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed';
  handoffError: string | null;

  // Mermaid Diagram
  currentDiagram: string;
}

// ==================== Store Actions Interface ====================

interface VibeActions {
  // Session Actions
  initializeSession: () => void;
  clearSession: () => void;

  // User Intent Actions
  setUserIntent: (intent: string) => void;
  appendToIntent: (addition: string) => void;

  // Tech Stack Actions
  updateTechStack: (updates: Partial<TechStack>) => void;
  setFrontend: (frontend: TechStack['frontend']) => void;
  setBackend: (backend: TechStack['backend']) => void;
  setDatabase: (database: TechStack['database']) => void;
  addService: (service: string) => void;
  removeService: (service: string) => void;

  // Constraint Actions
  addConstraint: (constraint: Omit<Constraint, 'id'>) => void;
  removeConstraint: (constraintId: string) => void;
  updateConstraint: (constraintId: string, updates: Partial<Constraint>) => void;

  // Style Preference Actions
  updateStylePreferences: (preferences: Partial<StylePreferences>) => void;

  // Chat Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setIsTyping: (isTyping: boolean) => void;

  // Agent Actions
  updateAgentStatus: (slotId: number, status: AgentStatus, task?: string, progress?: number) => void;
  resetAgents: () => void;

  // Handoff Actions
  setHandoffStatus: (status: VibeState['handoffStatus']) => void;
  setCurrentJobId: (jobId: string | null) => void;
  setHandoffError: (error: string | null) => void;

  // Diagram Actions
  setCurrentDiagram: (diagram: string) => void;

  // Utility Actions
  getVibeContext: () => VibeContext;
  reset: () => void;
  updateConfidence: (score: number) => void;
}

// ==================== Initial State ====================

const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate a proper UUID v4 — required by Aegis backend sessionId validation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const initialAgents: AgentSlot[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  status: 'idle' as AgentStatus,
}));

const initialState: VibeState = {
  sessionId: null,
  userIntent: '',
  techStack: {
    additionalServices: [],
  },
  constraints: [],
  stylePreferences: {
    colorScheme: 'dark',
    spacing: 'comfortable',
    animations: 'moderate',
  },
  contextVersion: 1,
  confidenceScore: 0,
  messages: [],
  isTyping: false,
  agents: initialAgents,
  currentJobId: null,
  handoffStatus: 'idle',
  handoffError: null,
  currentDiagram: `graph TD
    A[User Intent] --> B{Iris Analysis}
    B --> C[Tech Stack Selection]
    B --> D[Constraints Mapping]
    B --> E[Style Preferences]
    C --> F[Vibe Context]
    D --> F
    E --> F
    F --> G[Aegis Handoff]
    G --> H[16 AI Workers]
    H --> I[Generated Application]`,
};

// ==================== Store Implementation ====================

export const useVibeStore = create<VibeState & VibeActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Session Actions
        initializeSession: () => {
          const sessionId = generateUUID();
          set({ sessionId }, false, 'initializeSession');

          // Add welcome message
          get().addMessage({
            role: 'assistant',
            content: `Welcome to Iris! I'm here to help you capture the vibe of your project.

Tell me about the application you want to build. I'll help you define:
- **User Intent**: What should your app do?
- **Tech Stack**: What technologies should we use?
- **Constraints**: Any must-haves or things to avoid?
- **Style Preferences**: How should it look and feel?

Once we've captured your vision, I'll hand it off to Aegis and our team of 16 AI workers will bring it to life.

So, what are we building today?`,
          });
        },

        clearSession: () => {
          set({ ...initialState, sessionId: null }, false, 'clearSession');
        },

        // User Intent Actions
        setUserIntent: (intent) => {
          set(
            (state) => ({
              userIntent: intent,
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'setUserIntent'
          );
        },

        appendToIntent: (addition) => {
          set(
            (state) => ({
              userIntent: state.userIntent
                ? `${state.userIntent}\n\n${addition}`
                : addition,
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'appendToIntent'
          );
        },

        // Tech Stack Actions
        updateTechStack: (updates) => {
          set(
            (state) => ({
              techStack: { ...state.techStack, ...updates },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'updateTechStack'
          );
        },

        setFrontend: (frontend) => {
          set(
            (state) => ({
              techStack: { ...state.techStack, frontend },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'setFrontend'
          );
        },

        setBackend: (backend) => {
          set(
            (state) => ({
              techStack: { ...state.techStack, backend },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'setBackend'
          );
        },

        setDatabase: (database) => {
          set(
            (state) => ({
              techStack: { ...state.techStack, database },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'setDatabase'
          );
        },

        addService: (service) => {
          set(
            (state) => ({
              techStack: {
                ...state.techStack,
                additionalServices: [
                  ...new Set([...state.techStack.additionalServices, service]),
                ],
              },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'addService'
          );
        },

        removeService: (service) => {
          set(
            (state) => ({
              techStack: {
                ...state.techStack,
                additionalServices: state.techStack.additionalServices.filter(
                  (s) => s !== service
                ),
              },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'removeService'
          );
        },

        // Constraint Actions
        addConstraint: (constraint) => {
          const id = `constraint_${generateId()}`;
          set(
            (state) => ({
              constraints: [...state.constraints, { ...constraint, id }],
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'addConstraint'
          );
        },

        removeConstraint: (constraintId) => {
          set(
            (state) => ({
              constraints: state.constraints.filter((c) => c.id !== constraintId),
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'removeConstraint'
          );
        },

        updateConstraint: (constraintId, updates) => {
          set(
            (state) => ({
              constraints: state.constraints.map((c) =>
                c.id === constraintId ? { ...c, ...updates } : c
              ),
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'updateConstraint'
          );
        },

        // Style Preference Actions
        updateStylePreferences: (preferences) => {
          set(
            (state) => ({
              stylePreferences: { ...state.stylePreferences, ...preferences },
              contextVersion: state.contextVersion + 1,
            }),
            false,
            'updateStylePreferences'
          );
        },

        // Chat Actions
        addMessage: (message) => {
          const id = `msg_${generateId()}`;
          const timestamp = new Date().toISOString();
          set(
            (state) => ({
              messages: [...state.messages, { ...message, id, timestamp }],
            }),
            false,
            'addMessage'
          );
        },

        clearMessages: () => {
          set({ messages: [] }, false, 'clearMessages');
        },

        setIsTyping: (isTyping) => {
          set({ isTyping }, false, 'setIsTyping');
        },

        // Agent Actions
        updateAgentStatus: (slotId, status, task, progress) => {
          set(
            (state) => ({
              agents: state.agents.map((agent) =>
                agent.id === slotId
                  ? {
                      ...agent,
                      status,
                      currentTask: task ?? agent.currentTask,
                      progress: progress ?? agent.progress,
                      startedAt: status === 'working' ? new Date().toISOString() : agent.startedAt,
                      completedAt: status === 'success' || status === 'error' ? new Date().toISOString() : undefined,
                    }
                  : agent
              ),
            }),
            false,
            'updateAgentStatus'
          );
        },

        resetAgents: () => {
          set({ agents: initialAgents }, false, 'resetAgents');
        },

        // Handoff Actions
        setHandoffStatus: (handoffStatus) => {
          set({ handoffStatus }, false, 'setHandoffStatus');
        },

        setCurrentJobId: (currentJobId) => {
          set({ currentJobId }, false, 'setCurrentJobId');
        },

        setHandoffError: (handoffError) => {
          set({ handoffError }, false, 'setHandoffError');
        },

        // Diagram Actions
        setCurrentDiagram: (currentDiagram) => {
          set({ currentDiagram }, false, 'setCurrentDiagram');
        },

        // Utility Actions
        getVibeContext: () => {
          const state = get();
          return {
            sessionId: state.sessionId || 'unknown',
            userIntent: state.userIntent,
            techStack: state.techStack,
            constraints: state.constraints,
            stylePreferences: state.stylePreferences,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: state.contextVersion,
              confidence: state.confidenceScore,
            },
          };
        },

        reset: () => {
          set({ ...initialState }, false, 'reset');
        },

        updateConfidence: (score) => {
          set({ confidenceScore: Math.max(0, Math.min(1, score)) }, false, 'updateConfidence');
        },
      }),
      {
        name: 'iris-vibe-storage',
        partialize: (state) => ({
          sessionId: state.sessionId,
          userIntent: state.userIntent,
          techStack: state.techStack,
          constraints: state.constraints,
          stylePreferences: state.stylePreferences,
          messages: state.messages.slice(-50), // Only persist last 50 messages
        }),
      }
    ),
    { name: 'VibeStore' }
  )
);

// ==================== Selectors ====================

export const selectVibeContext = (state: VibeState & VibeActions) => state.getVibeContext();
export const selectMessages = (state: VibeState & VibeActions) => state.messages;
export const selectAgents = (state: VibeState & VibeActions) => state.agents;
export const selectHandoffStatus = (state: VibeState & VibeActions) => state.handoffStatus;
export const selectIsReady = (state: VibeState & VibeActions) =>
  state.userIntent.length > 10 && state.confidenceScore >= 0.5;
