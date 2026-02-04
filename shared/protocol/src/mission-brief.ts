/**
 * @fileoverview Mission Brief types and interfaces
 * Defines the structure of a mission that Iris sends to Aegis for execution
 */

/**
 * Mission status enumeration
 * Tracks the lifecycle of a mission from creation to completion
 */
export enum MissionStatus {
  /** Mission has been created but not yet started */
  Pending = 'Pending',
  /** Mission is currently being processed by agents */
  InProgress = 'InProgress',
  /** Mission has been paused by user or system */
  Paused = 'Paused',
  /** Mission completed successfully */
  Completed = 'Completed',
  /** Mission failed due to an error */
  Failed = 'Failed',
  /** Mission was cancelled by user */
  Cancelled = 'Cancelled'
}

/**
 * Priority levels for mission execution
 * Determines the order and resource allocation for missions
 */
export enum Priority {
  /** Low priority - processed when resources are available */
  Low = 'Low',
  /** Medium priority - standard processing */
  Medium = 'Medium',
  /** High priority - prioritized processing */
  High = 'High',
  /** Critical priority - immediate attention required */
  Critical = 'Critical'
}

/**
 * Technology stack preferences for the project
 * Defines the user's preferred technologies for different layers
 */
export interface TechStack {
  /** Frontend framework preference (e.g., 'React', 'Vue', 'Svelte') */
  frontend: string;
  /** Backend framework preference (e.g., 'Node.js', 'Python', 'Go') */
  backend: string;
  /** Database preference (e.g., 'PostgreSQL', 'MongoDB', 'SQLite') */
  database: string;
  /** Additional technologies or tools */
  additional?: string[];
}

/**
 * UI/UX style preferences for the generated application
 * Guides the visual design decisions made by agents
 */
export interface StylePreferences {
  /** Overall design theme (e.g., 'modern', 'minimal', 'corporate') */
  theme: string;
  /** Primary color for the UI (hex or named color) */
  primaryColor?: string;
  /** Secondary color for the UI (hex or named color) */
  secondaryColor?: string;
  /** Font family preference */
  fontFamily?: string;
  /** Preferred component library (e.g., 'Tailwind', 'Material-UI', 'Chakra') */
  componentLibrary?: string;
  /** Dark mode support requirement */
  darkMode?: boolean;
  /** Responsive design breakpoints preference */
  responsive?: boolean;
  /** Accessibility level requirement (e.g., 'WCAG-AA', 'WCAG-AAA') */
  accessibilityLevel?: string;
}

/**
 * Context capturing the user's project vision and requirements
 * This is the "vibe" that drives all agent decisions
 */
export interface VibeContext {
  /** Natural language description of what the user wants to build */
  userIntent: string;
  /** Technology stack preferences */
  techStack: TechStack;
  /** Constraints and limitations for the project */
  constraints: string[];
  /** UI/UX style preferences */
  stylePreferences: StylePreferences;
  /** Optional detailed feature requirements */
  features?: string[];
  /** Optional reference projects or inspirations */
  references?: string[];
  /** Target audience description */
  targetAudience?: string;
}

/**
 * Mission Brief - The complete specification for a development mission
 * This is the primary payload sent from Iris to Aegis to initiate work
 */
export interface MissionBrief {
  /** Unique identifier for the mission (UUID v4) */
  id: string;
  /** The vibe context containing user requirements and preferences */
  vibeContext: VibeContext;
  /** Timestamp when the mission was created */
  createdAt: Date;
  /** Current status of the mission */
  status: MissionStatus;
  /** Priority level for this mission */
  priority: Priority;
  /** Optional deadline for mission completion */
  deadline?: Date;
  /** Optional tags for categorization */
  tags?: string[];
  /** Optional parent mission ID for sub-missions */
  parentMissionId?: string;
}

/**
 * Factory function type for creating a new MissionBrief
 */
export type CreateMissionBriefInput = Omit<MissionBrief, 'id' | 'createdAt' | 'status'> & {
  id?: string;
  createdAt?: Date;
  status?: MissionStatus;
};
