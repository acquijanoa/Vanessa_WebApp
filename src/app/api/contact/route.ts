import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimStr(v: unknown, max: number): string {
  if (typeof v !== "string") {
    return "";
  }
  return v.trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const name = trimStr(o.name, 200);
  const email = trimStr(o.email, 320);
  const message = trimStr(o.message, 10000);

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Introduce un correo válido." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "El mensaje debe tener al menos 10 caracteres." },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "El envío no está disponible ahora (configuración del servidor)." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email,
    message,
  });

  if (error) {
    console.error("contact_inquiries insert:", error);
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
