import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, safeStringMatch } from "@/lib/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    console.error("ADMIN_USERNAME / ADMIN_PASSWORD not configured");
    return NextResponse.json(
      { error: "Acceso administrativo no configurado en el servidor." },
      { status: 503 },
    );
  }

  if (!safeStringMatch(username, expectedUser) || !safeStringMatch(password, expectedPass)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  let token: string;
  try {
    token = await createAdminSessionToken();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error de configuración de sesión (ADMIN_JWT_SECRET)." },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
