import { NextRequest, NextResponse } from "next/server";
import {
  appendPortfolioItemImages,
  getPortfolioItems,
  updatePortfolioItem,
} from "@/lib/portfolio-data";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 12;

type Params = { id: string };

export async function POST(req: NextRequest, context: { params: Promise<Params> }) {
  const denied = await requireAdmin(req);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
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
    return NextResponse.json({ error: `Máximo ${MAX_FILES} imágenes por solicitud.` }, { status: 400 });
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
    images.push({ buffer: Buffer.from(await blob.arrayBuffer()), mimeType });
  }

  try {
    const item = await appendPortfolioItemImages(id, images);
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

  const raw = req.nextUrl.searchParams.get("index");
  if (raw === null || raw === "") {
    return NextResponse.json({ error: "Falta ?index=" }, { status: 400 });
  }
  const index = Number(raw);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Índice inválido." }, { status: 400 });
  }

  const items = await getPortfolioItems({ includeUnpublished: true });
  const item = items.find((i) => i.id === id);
  if (!item) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  if (index >= item.imageUrls.length) {
    return NextResponse.json({ error: "Índice fuera de rango." }, { status: 400 });
  }
  if (item.imageUrls.length <= 1) {
    return NextResponse.json({ error: "No puedes borrar la única imagen del trabajo." }, { status: 400 });
  }

  const nextUrls = item.imageUrls.filter((_, i) => i !== index);

  try {
    const updated = await updatePortfolioItem(id, { imageUrls: nextUrls });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ item: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
