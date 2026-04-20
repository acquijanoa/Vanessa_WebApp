import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import type { PortfolioCategory, PortfolioItem } from "@/lib/portfolio-types";
import { createServerClient } from "@/lib/supabase/server";

const DATA_FILE = path.join(process.cwd(), "data", "portfolio-items.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "portfolio");
const STORAGE_BUCKET = "portfolio";

type Store = { items: PortfolioItem[] };

function useSupabase(): boolean {
  return createServerClient() !== null;
}

/** Vercel/AWS Lambda use a read-only filesystem under `/var/task` — never write to `public/uploads` there. */
function isReadOnlyServerlessDeploy(): boolean {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return true;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return true;
  }
  try {
    const cwd = process.cwd();
    if (cwd.includes("/var/task") || cwd.includes("lambda")) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function assertFsPortfolioAllowed(): void {
  if (isReadOnlyServerlessDeploy()) {
    throw new Error(
      "Este entorno no permite guardar archivos en disco. Añade en Vercel: NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL), y una clave pública (anon/publishable) o SUPABASE_SERVICE_ROLE_KEY. Luego redeploy.",
    );
  }
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return parsed;
  } catch {
    return { items: [] };
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function mimeToExt(mime: string): string | null {
  const m: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return m[mime] ?? null;
}

function extractStorageObjectPath(mediaUrl: string): string | null {
  const needle = `/object/public/${STORAGE_BUCKET}/`;
  const i = mediaUrl.indexOf(needle);
  if (i === -1) {
    return null;
  }
  return mediaUrl.slice(i + needle.length);
}

type PortfolioRow = {
  id: string;
  category: PortfolioCategory;
  title: string | null;
  description: string | null;
  media_url: string;
  created_at: string;
};

function mapRowToItem(row: PortfolioRow): PortfolioItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title ?? "",
    description: row.description ?? "",
    imageUrl: row.media_url,
    createdAt: row.created_at,
  };
}

export async function getPortfolioItems(options?: {
  /** When true, returns unpublished rows too (admin). */
  includeUnpublished?: boolean;
}): Promise<PortfolioItem[]> {
  if (useSupabase()) {
    const supabase = createServerClient()!;
    let q = supabase
      .from("portfolio_items")
      .select("id, category, title, description, media_url, created_at")
      .order("created_at", { ascending: false });

    if (!options?.includeUnpublished) {
      q = q.eq("published", true);
    }

    const { data, error } = await q;
    if (error) {
      console.error(error);
      throw new Error("No se pudo leer el portfolio.");
    }
    return (data as PortfolioRow[] | null)?.map(mapRowToItem) ?? [];
  }

  const { items } = await readStore();
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function addPortfolioItem(input: {
  category: PortfolioCategory;
  title: string;
  description: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<PortfolioItem> {
  const ext = mimeToExt(input.mimeType);
  if (!ext) {
    throw new Error("Tipo de imagen no permitido (usa JPG, PNG, WebP o GIF).");
  }

  const id = randomUUID();

  if (useSupabase()) {
    return addPortfolioItemSupabase(input, id, ext);
  }

  assertFsPortfolioAllowed();

  const filename = `${id}.${ext}`;
  const imageUrl = `/uploads/portfolio/${filename}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(filePath, input.imageBuffer);

  const item: PortfolioItem = {
    id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    imageUrl,
    createdAt: new Date().toISOString(),
  };

  const store = await readStore();
  store.items.unshift(item);
  await writeStore(store);
  return item;
}

async function addPortfolioItemSupabase(
  input: {
    category: PortfolioCategory;
    title: string;
    description: string;
    imageBuffer: Buffer;
    mimeType: string;
  },
  id: string,
  ext: string,
): Promise<PortfolioItem> {
  const supabase = createServerClient()!;
  const objectPath = `items/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, input.imageBuffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error(uploadError);
    const msg = uploadError.message?.toLowerCase() ?? "";
    if (msg.includes("bucket") || msg.includes("not found")) {
      throw new Error(
        'No existe el bucket de Storage «portfolio». Ejecuta la migración 002 en Supabase (SQL Editor) o créalo en el panel.',
      );
    }
    throw new Error("No se pudo subir la imagen a Supabase Storage.");
  }

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  const mediaUrl = pub.publicUrl;

  const { data: inserted, error: insertError } = await supabase
    .from("portfolio_items")
    .insert({
      id,
      category: input.category,
      media_type: "image",
      title: input.title.trim(),
      description: input.description.trim(),
      media_url: mediaUrl,
      published: true,
      sort_order: 0,
    })
    .select("created_at")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(STORAGE_BUCKET).remove([objectPath]).catch(() => {});
    console.error(insertError);
    const code = insertError?.code ?? "";
    const hint = insertError?.hint ?? "";
    const combined = `${insertError?.message ?? ""} ${hint}`;
    if (
      code === "42501" ||
      combined.toLowerCase().includes("permission") ||
      combined.toLowerCase().includes("policy")
    ) {
      throw new Error(
        "Sin permiso para escribir en la base de datos. Añade SUPABASE_SERVICE_ROLE_KEY en Vercel (solo servidor) para el panel de administración.",
      );
    }
    if (combined.includes("description") && combined.includes("column")) {
      throw new Error(
        "Falta la columna description en portfolio_items. Ejecuta supabase/migrations/002_portfolio_storage.sql en el SQL Editor.",
      );
    }
    throw new Error("No se pudo guardar la entrada en la base de datos.");
  }

  return {
    id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    imageUrl: mediaUrl,
    createdAt: inserted.created_at,
  };
}

export async function removePortfolioItem(id: string): Promise<boolean> {
  if (useSupabase()) {
    const supabase = createServerClient()!;
    const { data: row } = await supabase
      .from("portfolio_items")
      .select("media_url")
      .eq("id", id)
      .maybeSingle();

    if (!row?.media_url) {
      return false;
    }

    const objectPath = extractStorageObjectPath(row.media_url);

    const { error: deleteError } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (deleteError) {
      console.error(deleteError);
      return false;
    }

    if (objectPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([objectPath]).catch(() => {});
    }
    return true;
  }

  assertFsPortfolioAllowed();

  const store = await readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return false;
  }
  const [removed] = store.items.splice(idx, 1);
  await writeStore(store);

  const rel = removed.imageUrl.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", rel);
  await fs.unlink(filePath).catch(() => {});

  return true;
}
