import { NextRequest, NextResponse } from "next/server";

const AEGIS_URL = process.env.AEGIS_INTERNAL_URL || "http://localhost:8080";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = "/" + pathSegments.join("/");
  const url = `${AEGIS_URL}${path}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      init.body = await request.text();
    } catch {}
  }

  try {
    const res = await fetch(url, init);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "PROXY_ERROR", message: "Aegis is not reachable" } },
      { status: 502 }
    );
  }
}
