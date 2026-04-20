import { NextRequest, NextResponse } from "next/server";
import { getPortfolioItems, reorderPortfolioItems } from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const orderedIds = (body as { orderedIds?: unknown }).orderedIds;
  if (!Array.isArray(orderedIds) || !orderedIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "orderedIds debe ser un array de ids." }, { status: 400 });
  }

  const current = await getPortfolioItems({ includeUnpublished: true });
  if (orderedIds.length !== current.length) {
    return NextResponse.json(
      { error: "El número de ids no coincide con las entradas existentes." },
      { status: 400 },
    );
  }

  try {
    await reorderPortfolioItems(orderedIds);
    const items = await getPortfolioItems({ includeUnpublished: true });
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
