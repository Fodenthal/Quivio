import { createHash } from "node:crypto";

const ADMIN_SESSION_COOKIE = "admin_session";
const HASH_ALGORITHM = "sha256";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_DASHBOARD_SECRET;
  if (!secret) {
    throw new Error("ADMIN_DASHBOARD_SECRET environment variable is not configured");
  }
  return secret;
}

export function getExpectedSessionToken(): string {
  const secret = getAdminSecret();
  return createHash(HASH_ALGORITHM).update(secret).digest("hex");
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    return token === getExpectedSessionToken();
  } catch (error) {
    console.error("Admin auth verification failed:", error);
    return false;
  }
}

export function getSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}
