import { NextRequest, NextResponse } from "next/server";
import { addPortfolioItem } from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";
import { isPortfolioCategory } from "@/lib/portfolio-types";

const MAX_BYTES = 12 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  }

  const category = form.get("category");
  const title = form.get("title");
  const description = form.get("description");
  const file = form.get("image");

  if (typeof category !== "string" || !isPortfolioCategory(category)) {
    return NextResponse.json({ error: "Categoría no válida." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  }
  if (typeof description !== "string") {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }

  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera el tamaño máximo (12 MB)." }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const item = await addPortfolioItem({
      category,
      title,
      description,
      imageBuffer: buffer,
      mimeType,
    });
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
