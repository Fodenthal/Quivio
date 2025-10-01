import type { NextRequest } from 'next/server';
import { proxyAdminRequest } from '../utils';

interface RouteParams {
  roomId: string;
}

export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  const { roomId } = params;
  return proxyAdminRequest(request, `/api/admin/rooms/${roomId}`);
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const { roomId } = params;
  let reason: string | undefined;

  try {
    const json = await request.json();
    if (json && typeof json.reason === 'string') {
      reason = json.reason;
    }
  } catch {
    // Ignore body parsing errors; reason remains undefined
  }

  if (!reason) {
    const queryReason = request.nextUrl.searchParams.get('reason');
    if (queryReason) {
      reason = queryReason;
    }
  }

  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return proxyAdminRequest(request, `/api/admin/rooms/${roomId}${query}`, {
    method: 'DELETE',
  });
}
