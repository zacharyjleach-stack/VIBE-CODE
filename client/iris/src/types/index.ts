/**
 * Iris Frontend Types
 * Core type definitions for the Vibe Coding Platform UI
 */

// ==================== Vibe Context Types ====================

export interface VibeContext {
  sessionId: string;
  userIntent: string;
  techStack: TechStack;
  constraints: Constraint[];
  stylePreferences: StylePreferences;
  metadata: ContextMetadata;
}

export interface TechStack {
  frontend?: FrameworkChoice;
  backend?: FrameworkChoice;
  database?: DatabaseChoice;
  infrastructure?: InfrastructureChoice;
  additionalServices: string[];
}

export interface FrameworkChoice {
  name: string;
  version?: string;
  packages?: string[];
}

export interface DatabaseChoice {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis' | 'other';
  name: string;
  hosted?: boolean;
}

export interface InfrastructureChoice {
  provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'railway' | 'docker' | 'other';
  services: string[];
}

export interface Constraint {
  id: string;
  type: 'must-have' | 'nice-to-have' | 'avoid';
  description: string;
  category: 'performance' | 'security' | 'accessibility' | 'compatibility' | 'other';
}

export interface StylePreferences {
  designSystem?: string;
  colorScheme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  typography?: string;
  spacing?: 'compact' | 'comfortable' | 'spacious';
  animations?: 'minimal' | 'moderate' | 'expressive';
}

export interface ContextMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  confidence: number; // 0-1 score of how well we understand user intent
}

// ==================== Chat Types ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  vibeUpdates?: Partial<VibeContext>;
  suggestions?: string[];
  clarifications?: ClarificationRequest[];
}

export interface ClarificationRequest {
  id: string;
  question: string;
  options?: string[];
  field: keyof VibeContext;
}

// ==================== Agent Types ====================

export type AgentStatus = 'idle' | 'working' | 'success' | 'error' | 'waiting';

export interface AgentSlot {
  id: number;
  status: AgentStatus;
  currentTask?: string;
  progress?: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentUpdate {
  slotId: number;
  status: AgentStatus;
  task?: string;
  progress?: number;
  message?: string;
  timestamp: string;
}

// ==================== Handoff Types ====================

export interface HandoffRequest {
  vibeContext: VibeContext;
  priority?: 'low' | 'normal' | 'high';
  dryRun?: boolean;
}

export interface HandoffResponse {
  success: boolean;
  jobId?: string;
  estimatedTime?: number; // in seconds
  message: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ==================== Visualization Types ====================

export interface MermaidDiagram {
  type: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt';
  code: string;
  title?: string;
}

export interface ComponentPreview {
  id: string;
  name: string;
  code: string;
  language: 'tsx' | 'jsx' | 'html';
  props?: Record<string, unknown>;
}

// ==================== WebSocket Types ====================

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: string;
}

export type WSMessageType =
  | 'agent_update'
  | 'job_progress'
  | 'job_complete'
  | 'job_error'
  | 'system_status'
  | 'diagram_update'
  | 'ping'
  | 'pong';

export interface WSAgentUpdatePayload {
  agents: AgentSlot[];
}

export interface WSJobProgressPayload {
  jobId: string;
  progress: number;
  stage: string;
  message: string;
}

export interface WSJobCompletePayload {
  jobId: string;
  success: boolean;
  result?: {
    repositoryUrl?: string;
    deploymentUrl?: string;
    artifacts: string[];
  };
}

// ==================== API Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==================== Session Types ====================

export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  vibeContext: VibeContext;
  messages: ChatMessage[];
  currentJobId?: string;
}
