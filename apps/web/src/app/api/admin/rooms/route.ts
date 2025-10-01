import { proxyAdminRequest } from './utils';

export async function GET() {
  return proxyAdminRequest('/api/admin/rooms');
}
