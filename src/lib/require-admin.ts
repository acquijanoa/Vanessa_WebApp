import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminJwtSecretBytes } from "@/lib/admin-session";

/** Returns null if OK; otherwise an error Response for the route handler. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const secret = getAdminJwtSecretBytes();
  if (!secret) {
    return NextResponse.json({ error: "Servidor sin ADMIN_JWT_SECRET." }, { status: 503 });
  }
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    await jwtVerify(token, secret);
    return null;
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }
}
