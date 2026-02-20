import { NextRequest, NextResponse } from "next/server";

// Aegis runs on port 3001. All API routes are under /api/, except /health at root.
const AEGIS_BASE = process.env.AEGIS_INTERNAL_URL || "http://localhost:3001";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const relativePath = "/" + pathSegments.join("/");
  // Backend health is at root /health; all other routes are under /api/
  const backendPath = pathSegments[0] === "health" ? relativePath : `/api${relativePath}`;
  const url = `${AEGIS_BASE}${backendPath}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      init.body = await request.text();
    } catch {}
  }

  try {
    const res = await fetch(url, init);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "PROXY_ERROR", message: "Aegis backend is not reachable" } },
      { status: 502 }
    );
  }
}
