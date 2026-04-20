import { NextRequest, NextResponse } from "next/server";
import { removePortfolioItem, updatePortfolioItem } from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";
import { isPortfolioCategory, type PortfolioCategory } from "@/lib/portfolio-types";

export const runtime = "nodejs";

type Params = { id: string };

export async function PATCH(req: NextRequest, context: { params: Promise<Params> }) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
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

  const o = body as Record<string, unknown>;
  const patch: {
    title?: string;
    description?: string;
    category?: PortfolioCategory;
    sortOrder?: number;
    imageUrls?: string[];
  } = {};

  if ("title" in o) {
    if (typeof o.title !== "string" || !o.title.trim()) {
      return NextResponse.json({ error: "Título inválido." }, { status: 400 });
    }
    patch.title = o.title;
  }
  if ("description" in o) {
    if (typeof o.description !== "string") {
      return NextResponse.json({ error: "Descripción inválida." }, { status: 400 });
    }
    patch.description = o.description;
  }
  if ("category" in o) {
    if (typeof o.category !== "string" || !isPortfolioCategory(o.category)) {
      return NextResponse.json({ error: "Categoría no válida." }, { status: 400 });
    }
    patch.category = o.category;
  }
  if ("sortOrder" in o) {
    if (typeof o.sortOrder !== "number" || !Number.isFinite(o.sortOrder)) {
      return NextResponse.json({ error: "sortOrder inválido." }, { status: 400 });
    }
    patch.sortOrder = o.sortOrder;
  }
  if ("imageUrls" in o) {
    if (!Array.isArray(o.imageUrls) || !o.imageUrls.every((u) => typeof u === "string")) {
      return NextResponse.json({ error: "imageUrls debe ser un array de URLs." }, { status: 400 });
    }
    patch.imageUrls = o.imageUrls as string[];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const item = await updatePortfolioItem(id, patch);
    if (!item) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
  }

  const ok = await removePortfolioItem(id);
  if (!ok) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
