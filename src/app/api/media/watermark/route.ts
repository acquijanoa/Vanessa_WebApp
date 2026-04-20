import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { applyWatermark } from "@/lib/watermark";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

function isSafeRelativeFile(file: string): boolean {
  if (!file || file.includes("..") || path.isAbsolute(file)) {
    return false;
  }
  const normalized = path.normalize(file);
  return !normalized.startsWith("..") && !path.isAbsolute(normalized);
}

/**
 * GET /api/media/watermark?file=sample-comp.jpg
 * Headers: x-watermark-user (preferred) or query ?user=
 *
 * Production: validate Supabase session / JWT and derive display name;
 * never trust client-supplied labels alone.
 */
export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  const userLabel =
    req.headers.get("x-watermark-user") ??
    req.nextUrl.searchParams.get("user") ??
    "Verified client";

  if (!file || !isSafeRelativeFile(file)) {
    return new Response("Invalid file path", { status: 400 });
  }

  const absolutePath = path.join(PUBLIC_ROOT, file);
  if (!absolutePath.startsWith(PUBLIC_ROOT)) {
    return new Response("Forbidden", { status: 403 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(absolutePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const watermarked = await applyWatermark(buffer, {
    userLabel: userLabel.slice(0, 120),
    timestampIso: new Date().toISOString(),
  });

  return new Response(new Uint8Array(watermarked), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
