import type { NextRequest } from 'next/server';
import { proxyAdminRequest } from './utils';

export async function GET(request: NextRequest) {
  return proxyAdminRequest(request, '/api/admin/rooms');
}
