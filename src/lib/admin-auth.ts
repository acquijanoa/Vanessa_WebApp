import { createHash, timingSafeEqual } from "crypto";
import { SignJWT } from "jose";
import { getAdminJwtSecretBytes } from "@/lib/admin-session";

function requireAdminJwtSecretBytes(): Uint8Array {
  const k = getAdminJwtSecretBytes();
  if (!k) {
    throw new Error(
      "ADMIN_JWT_SECRET is missing or too short (use at least 32 random characters).",
    );
  }
  return k;
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(requireAdminJwtSecretBytes());
}

/** Timing-safe compare of UTF-8 strings via SHA-256 digests. */
export function safeStringMatch(provided: string, expected: string | undefined): boolean {
  if (!expected?.length) {
    return false;
  }
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}
