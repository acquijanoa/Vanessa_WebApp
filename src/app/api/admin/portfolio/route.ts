import { NextRequest, NextResponse } from "next/server";
import { addPortfolioItem } from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";
import { isPortfolioCategory } from "@/lib/portfolio-types";

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 12;

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

  if (typeof category !== "string" || !isPortfolioCategory(category)) {
    return NextResponse.json({ error: "Categoría no válida." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  }
  if (typeof description !== "string") {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }

  const blobs: Blob[] = [];
  for (const x of form.getAll("images")) {
    if (x instanceof Blob && x.size > 0) {
      blobs.push(x);
    }
  }

  if (blobs.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una imagen." }, { status: 400 });
  }
  if (blobs.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILES} imágenes por trabajo.` },
      { status: 400 },
    );
  }

  const images: { buffer: Buffer; mimeType: string }[] = [];
  for (const blob of blobs) {
    if (blob.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Cada imagen debe ser de 12 MB o menos." },
        { status: 400 },
      );
    }
    const mimeType = blob.type || "application/octet-stream";
    const buffer = Buffer.from(await blob.arrayBuffer());
    images.push({ buffer, mimeType });
  }

  try {
    const item = await addPortfolioItem({
      category,
      title,
      description,
      images,
    });
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
