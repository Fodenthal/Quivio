import type { NextRequest } from 'next/server';
import { proxyAdminRequest } from '../utils';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return proxyAdminRequest(`/api/admin/rooms/${roomId}`);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
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
  return proxyAdminRequest(`/api/admin/rooms/${roomId}${query}`, {
    method: 'DELETE',
  });
}
