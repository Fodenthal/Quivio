import type { NextRequest } from 'next/server';
import { proxyAdminRequest } from '../utils';

type RoomParams = {
  roomId: string;
};

function extractRoomParams(context: unknown): RoomParams {
  const params = (context as { params?: RoomParams })?.params;
  if (!params || typeof params.roomId !== 'string') {
    throw new Error('Missing roomId parameter');
  }
  return params;
}

export async function GET(request: NextRequest, context: unknown) {
  const { roomId } = extractRoomParams(context);
  return proxyAdminRequest(request, `/api/admin/rooms/${roomId}`);
}

export async function DELETE(request: NextRequest, context: unknown) {
  const { roomId } = extractRoomParams(context);
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
