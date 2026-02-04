/**
 * Iris API Client
 * Handles all communication with the Aegis backend
 */

import type {
  ApiResponse,
  VibeContext,
  HandoffRequest,
  HandoffResponse,
  Session,
  AgentSlot,
} from '@/types';

// ==================== Configuration ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_AEGIS_API_URL || '/api/aegis';
const API_TIMEOUT = 30000; // 30 seconds

// ==================== Fetch Wrapper ====================

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = API_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || `Request failed with status ${response.status}`,
          details: data.details,
        },
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

// ==================== API Methods ====================

/**
 * Health check for the Aegis API
 */
export async function healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
  return apiRequest('/health');
}

/**
 * Submit vibe context for handoff to Aegis
 */
export async function handoff(vibeContext: VibeContext): Promise<ApiResponse<HandoffResponse>> {
  const request: HandoffRequest = {
    vibeContext,
    priority: 'normal',
    dryRun: false,
  };

  return apiRequest('/handoff', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Submit vibe context for validation (dry run)
 */
export async function validateVibeContext(
  vibeContext: VibeContext
): Promise<ApiResponse<HandoffResponse>> {
  const request: HandoffRequest = {
    vibeContext,
    priority: 'normal',
    dryRun: true,
  };

  return apiRequest('/handoff', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<
  ApiResponse<{
    jobId: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    stage: string;
    message: string;
    result?: {
      repositoryUrl?: string;
      deploymentUrl?: string;
      artifacts: string[];
    };
    error?: string;
  }>
> {
  return apiRequest(`/jobs/${jobId}`);
}

/**
 * Cancel a running job
 */
export async function cancelJob(jobId: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
}

/**
 * Get current agent status
 */
export async function getAgentStatus(): Promise<ApiResponse<{ agents: AgentSlot[] }>> {
  return apiRequest('/agents/status');
}

/**
 * Create a new session
 */
export async function createSession(): Promise<ApiResponse<Session>> {
  return apiRequest('/sessions', {
    method: 'POST',
  });
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<ApiResponse<Session>> {
  return apiRequest(`/sessions/${sessionId}`);
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  vibeContext: Partial<VibeContext>
): Promise<ApiResponse<Session>> {
  return apiRequest(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ vibeContext }),
  });
}

/**
 * Generate Mermaid diagram from vibe context
 */
export async function generateDiagram(
  vibeContext: VibeContext
): Promise<ApiResponse<{ diagram: string }>> {
  return apiRequest('/visualize/diagram', {
    method: 'POST',
    body: JSON.stringify({ vibeContext }),
  });
}

/**
 * Chat with AI assistant
 */
export async function chat(
  sessionId: string,
  message: string,
  vibeContext: VibeContext
): Promise<
  ApiResponse<{
    response: string;
    vibeUpdates?: Partial<VibeContext>;
    suggestions?: string[];
  }>
> {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      message,
      vibeContext,
    }),
  });
}

// ==================== Export API Client Object ====================

export const api = {
  healthCheck,
  handoff,
  validateVibeContext,
  getJobStatus,
  cancelJob,
  getAgentStatus,
  createSession,
  getSession,
  updateSession,
  generateDiagram,
  chat,
};

export default api;
