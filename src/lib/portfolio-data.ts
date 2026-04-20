import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import type { PortfolioCategory, PortfolioItem } from "@/lib/portfolio-types";
import { createServerClient } from "@/lib/supabase/server";

const DATA_FILE = path.join(process.cwd(), "data", "portfolio-items.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "portfolio");
const STORAGE_BUCKET = "portfolio";

const MAX_IMAGES_PER_ITEM = 12;
const MAX_BYTES_PER_FILE = 12 * 1024 * 1024;

type Store = { items: PortfolioItem[] };

type LegacyItem = PortfolioItem & { imageUrl?: string };

function normalizeItem(raw: LegacyItem): PortfolioItem {
  if (Array.isArray(raw.imageUrls) && raw.imageUrls.length > 0) {
    return {
      id: raw.id,
      category: raw.category,
      title: raw.title,
      description: raw.description,
      imageUrls: raw.imageUrls,
      createdAt: raw.createdAt,
    };
  }
  if (typeof raw.imageUrl === "string" && raw.imageUrl.length > 0) {
    return {
      id: raw.id,
      category: raw.category,
      title: raw.title,
      description: raw.description,
      imageUrls: [raw.imageUrl],
      createdAt: raw.createdAt,
    };
  }
  return {
    id: raw.id,
    category: raw.category,
    title: raw.title,
    description: raw.description,
    imageUrls: [],
    createdAt: raw.createdAt,
  };
}

function useSupabase(): boolean {
  return createServerClient() !== null;
}

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
    const parsed = JSON.parse(raw) as { items?: LegacyItem[] };
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return {
      items: parsed.items.map((i) => normalizeItem(i)),
    };
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
  media_url: string | null;
  image_urls?: string[] | null;
  created_at: string;
};

function mapRowToItem(row: PortfolioRow): PortfolioItem {
  const urls =
    row.image_urls && row.image_urls.length > 0
      ? row.image_urls
      : row.media_url
        ? [row.media_url]
        : [];
  return {
    id: row.id,
    category: row.category,
    title: row.title ?? "",
    description: row.description ?? "",
    imageUrls: urls,
    createdAt: row.created_at,
  };
}

const PORTFOLIO_SELECT_WITH_GALLERY =
  "id, category, title, description, media_url, image_urls, created_at";
const PORTFOLIO_SELECT_LEGACY = "id, category, title, description, media_url, created_at";

export async function getPortfolioItems(options?: {
  includeUnpublished?: boolean;
}): Promise<PortfolioItem[]> {
  if (useSupabase()) {
    const supabase = createServerClient()!;
    const runSelect = (columns: string) => {
      let q = supabase.from("portfolio_items").select(columns);
      if (!options?.includeUnpublished) {
        q = q.eq("published", true);
      }
      return q.order("created_at", { ascending: false });
    };

    let res = await runSelect(PORTFOLIO_SELECT_WITH_GALLERY);
    if (
      res.error?.code === "42703" &&
      (res.error.message?.includes("image_urls") ?? false)
    ) {
      res = await runSelect(PORTFOLIO_SELECT_LEGACY);
    }
    const { data, error } = res;
    if (error) {
      console.error(error);
      throw new Error("No se pudo leer el portfolio.");
    }
    const rows = (data ?? []) as unknown as PortfolioRow[];
    return rows.map(mapRowToItem);
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
  images: { buffer: Buffer; mimeType: string }[];
}): Promise<PortfolioItem> {
  if (!input.images.length) {
    throw new Error("Selecciona al menos una imagen.");
  }
  if (input.images.length > MAX_IMAGES_PER_ITEM) {
    throw new Error(`Máximo ${MAX_IMAGES_PER_ITEM} imágenes por trabajo.`);
  }
  for (const img of input.images) {
    if (img.buffer.length > MAX_BYTES_PER_FILE) {
      throw new Error("Cada imagen debe ser de 12 MB o menos.");
    }
    if (!mimeToExt(img.mimeType)) {
      throw new Error("Tipo de imagen no permitido (usa JPG, PNG, WebP o GIF).");
    }
  }

  const id = randomUUID();

  if (useSupabase()) {
    return addPortfolioItemSupabase(input, id);
  }

  assertFsPortfolioAllowed();

  const imageUrls: string[] = [];
  for (let i = 0; i < input.images.length; i++) {
    const img = input.images[i]!;
    const ext = mimeToExt(img.mimeType)!;
    const filename = `${id}-${i}.${ext}`;
    const publicPath = `/uploads/portfolio/${filename}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, img.buffer);
    imageUrls.push(publicPath);
  }

  const item: PortfolioItem = {
    id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    imageUrls,
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
    images: { buffer: Buffer; mimeType: string }[];
  },
  id: string,
): Promise<PortfolioItem> {
  const supabase = createServerClient()!;
  const uploadedPaths: string[] = [];

  const imageUrls: string[] = [];
  try {
    for (let i = 0; i < input.images.length; i++) {
      const img = input.images[i]!;
      const ext = mimeToExt(img.mimeType)!;
      const objectPath = `items/${id}/${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, img.buffer, {
          contentType: img.mimeType,
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
        throw new Error("No se pudo subir una imagen a Supabase Storage.");
      }

      uploadedPaths.push(objectPath);
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
      imageUrls.push(pub.publicUrl);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("portfolio_items")
      .insert({
        id,
        category: input.category,
        media_type: "image",
        title: input.title.trim(),
        description: input.description.trim(),
        media_url: imageUrls[0],
        image_urls: imageUrls,
        published: true,
        sort_order: 0,
      })
      .select("created_at")
      .single();

    if (insertError || !inserted) {
      console.error(insertError);
      await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
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
      if (combined.includes("image_urls") && combined.includes("column")) {
        throw new Error(
          "Falta la columna image_urls. Ejecuta supabase/migrations/006_portfolio_image_urls.sql en el SQL Editor.",
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
      imageUrls,
      createdAt: inserted.created_at,
    };
  } catch (e) {
    if (uploadedPaths.length) {
      await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
    }
    throw e;
  }
}

export async function removePortfolioItem(id: string): Promise<boolean> {
  if (useSupabase()) {
    const supabase = createServerClient()!;
    const { data: row } = await supabase
      .from("portfolio_items")
      .select("media_url, image_urls")
      .eq("id", id)
      .maybeSingle();

    if (!row) {
      return false;
    }

    const urls =
      row.image_urls && row.image_urls.length > 0
        ? row.image_urls
        : row.media_url
          ? [row.media_url]
          : [];

    const paths = urls
      .map((u: string) => extractStorageObjectPath(u))
      .filter((p: string | null): p is string => p != null && p.length > 0);

    const { error: deleteError } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (deleteError) {
      console.error(deleteError);
      return false;
    }

    if (paths.length) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths).catch(() => {});
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

  for (const url of removed.imageUrls) {
    const rel = url.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", rel);
    await fs.unlink(filePath).catch(() => {});
  }

  return true;
}
