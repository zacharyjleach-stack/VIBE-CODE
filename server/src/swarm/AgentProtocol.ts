export interface AgentMessage {
  id: string;
  from: "architect" | "builder" | "reviewer" | "system";
  to: "architect" | "builder" | "reviewer" | "system";
  type: "task" | "result" | "error" | "status";
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface AgentTask {
  taskId: string;
  description: string;
  context: Record<string, unknown>;
  priority: "low" | "medium" | "high" | "critical";
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  output: string;
  artifacts: string[];
}
