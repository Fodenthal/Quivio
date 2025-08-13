import { NextResponse } from 'next/server';

/**
 * API route to fetch popular topics from the Colyseus server
 * GET /api/topics/popular?limit=50
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';

    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2567';
    const httpServerUrl = serverUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/^wss:\/\//, 'https://');
    const apiUrl = `${httpServerUrl}/api/topics/popular?limit=${encodeURIComponent(limit)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status });
    }

    const data = await response.json();
    const res = NextResponse.json(data);
    // Cache for 60s at the edge/CDN; allow stale-while-revalidate
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

