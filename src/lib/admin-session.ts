/** Edge-safe: cookie name + JWT secret bytes (no Node crypto). */

export const ADMIN_SESSION_COOKIE = "vq_admin_session";

export function getAdminJwtSecretBytes(): Uint8Array | null {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 32) {
    return null;
  }
  return new TextEncoder().encode(s);
}
