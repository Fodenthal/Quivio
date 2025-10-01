import { NextResponse } from 'next/server';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit | null;
};

function buildServerUrl(path: string): string {
  const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2567';
  const httpServerUrl = serverUrl
    .replace(/^ws:\/\//, 'http://')
    .replace(/^wss:\/\//, 'https://');
  return `${httpServerUrl}${path}`;
}

export async function proxyAdminRequest(path: string, options: FetchOptions = {}) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'ADMIN_DASHBOARD_SECRET environment variable is not configured',
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(buildServerUrl(path), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret,
      },
      body: options.body ?? null,
      signal: AbortSignal.timeout(7000),
    });

    const text = await response.text();
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson && text ? JSON.parse(text) : text ? { success: false, error: text } : {};

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('❌ Admin rooms proxy error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request to game server timed out',
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to contact game server',
      },
      { status: 502 }
    );
  }
}
