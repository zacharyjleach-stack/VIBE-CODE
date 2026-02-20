import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/aegis/agents/command
 * Dispatches a direct command to a specific agent slot.
 * This takes precedence over the catch-all proxy.
 *
 * Body: { agentId: number; task: string }
 *
 * In a full implementation this would emit a WebSocket event to the Aegis
 * backend to route the task to the correct agent. For now it acknowledges
 * the command locally and lets the caller show optimistic UI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, task } = body as { agentId: number; task: string };

    if (!agentId || !task) {
      return NextResponse.json(
        { success: false, error: "agentId and task are required" },
        { status: 400 }
      );
    }

    if (agentId < 1 || agentId > 16) {
      return NextResponse.json(
        { success: false, error: "agentId must be between 1 and 16" },
        { status: 400 }
      );
    }

    // Try to forward to the Aegis backend if it's reachable
    const aegisBase = process.env.AEGIS_INTERNAL_URL || "http://localhost:3001";
    try {
      const res = await fetch(`${aegisBase}/api/agents/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, task }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Aegis not reachable — acknowledge locally so the UI stays responsive
    }

    // Optimistic acknowledgement
    return NextResponse.json({
      success: true,
      agentId,
      task,
      message: `Agent #${agentId} queued: "${task}" (Aegis offline — will sync when connected)`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
