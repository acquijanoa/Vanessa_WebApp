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
  const sortOrder = typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0;
  if (Array.isArray(raw.imageUrls) && raw.imageUrls.length > 0) {
    return {
      id: raw.id,
      category: raw.category,
      title: raw.title,
      description: raw.description,
      imageUrls: raw.imageUrls,
      sortOrder,
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
      sortOrder,
      createdAt: raw.createdAt,
    };
  }
  return {
    id: raw.id,
    category: raw.category,
    title: raw.title,
    description: raw.description,
    imageUrls: [],
    sortOrder,
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
  sort_order?: number | null;
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
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

const PORTFOLIO_SELECT_WITH_GALLERY =
  "id, category, title, description, media_url, image_urls, sort_order, created_at";
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
      return q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });
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
  return [...items].sort((a, b) => {
    const d = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (d !== 0) {
      return d;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function nextSortOrderForNewItem(): Promise<number> {
  const list = await getPortfolioItems({ includeUnpublished: true });
  if (list.length === 0) {
    return 0;
  }
  const min = list.reduce((m, i) => Math.min(m, i.sortOrder ?? 0), 0);
  return min - 1;
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

  const sortOrder = await nextSortOrderForNewItem();

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
    sortOrder,
    createdAt: new Date().toISOString(),
  };

  const store = await readStore();
  store.items.push(item);
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
  const sortOrder = await nextSortOrderForNewItem();

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
        sort_order: sortOrder,
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
      sortOrder,
      createdAt: inserted.created_at,
    };
  } catch (e) {
    if (uploadedPaths.length) {
      await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
    }
    throw e;
  }
}

async function deleteFsPortfolioFiles(urls: string[]): Promise<void> {
  for (const url of urls) {
    const rel = url.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", rel);
    await fs.unlink(filePath).catch(() => {});
  }
}

async function deleteSupabaseStorageFiles(urls: string[]): Promise<void> {
  if (!urls.length) {
    return;
  }
  const supabase = createServerClient()!;
  const paths = urls
    .map((u) => extractStorageObjectPath(u))
    .filter((p): p is string => p != null && p.length > 0);
  if (paths.length) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths).catch(() => {});
  }
}

export async function updatePortfolioItem(
  id: string,
  input: {
    title?: string;
    description?: string;
    category?: PortfolioCategory;
    sortOrder?: number;
    imageUrls?: string[];
  },
): Promise<PortfolioItem | null> {
  if (useSupabase()) {
    const supabase = createServerClient()!;
    const { data: row, error: fetchError } = await supabase
      .from("portfolio_items")
      .select("media_url, image_urls, category, title, description, sort_order, created_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !row) {
      return null;
    }

    const prevUrls: string[] =
      row.image_urls && row.image_urls.length > 0
        ? row.image_urls
        : row.media_url
          ? [row.media_url]
          : [];
    const prevSet = new Set(prevUrls);

    let nextUrls = prevUrls;
    if (input.imageUrls !== undefined) {
      for (const u of input.imageUrls) {
        if (!prevSet.has(u)) {
          throw new Error("Solo puedes reordenar o quitar imágenes existentes; usa «Añadir imágenes» para subir nuevas.");
        }
      }
      const removed = prevUrls.filter((u) => !input.imageUrls!.includes(u));
      nextUrls = [...input.imageUrls];
      if (removed.length) {
        await deleteSupabaseStorageFiles(removed);
      }
      if (nextUrls.length === 0) {
        throw new Error("Debe quedar al menos una imagen.");
      }
    }

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) {
      patch.title = input.title.trim();
    }
    if (input.description !== undefined) {
      patch.description = input.description.trim();
    }
    if (input.category !== undefined) {
      patch.category = input.category;
    }
    if (input.sortOrder !== undefined) {
      patch.sort_order = input.sortOrder;
    }
    if (input.imageUrls !== undefined) {
      patch.image_urls = nextUrls;
      patch.media_url = nextUrls[0] ?? null;
    }

    if (Object.keys(patch).length === 0) {
      const { data: again } = await supabase
        .from("portfolio_items")
        .select(PORTFOLIO_SELECT_WITH_GALLERY)
        .eq("id", id)
        .maybeSingle();
      return again ? mapRowToItem(again as PortfolioRow) : null;
    }

    const { data: updated, error: upError } = await supabase
      .from("portfolio_items")
      .update(patch)
      .eq("id", id)
      .select(PORTFOLIO_SELECT_WITH_GALLERY)
      .maybeSingle();

    if (upError || !updated) {
      console.error(upError);
      throw new Error("No se pudo actualizar la entrada.");
    }
    return mapRowToItem(updated as PortfolioRow);
  }

  assertFsPortfolioAllowed();
  const store = await readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return null;
  }
  const item = store.items[idx]!;
  const prevUrls = [...item.imageUrls];
  const prevSet = new Set(prevUrls);

  let nextUrls = prevUrls;
  if (input.imageUrls !== undefined) {
    for (const u of input.imageUrls) {
      if (!prevSet.has(u)) {
        throw new Error("Solo puedes reordenar o quitar imágenes existentes; usa «Añadir imágenes» para subir nuevas.");
      }
    }
    const removed = prevUrls.filter((u) => !input.imageUrls!.includes(u));
    nextUrls = [...input.imageUrls];
    if (removed.length) {
      await deleteFsPortfolioFiles(removed);
    }
    if (nextUrls.length === 0) {
      throw new Error("Debe quedar al menos una imagen.");
    }
  }

  const next: PortfolioItem = {
    ...item,
    title: input.title !== undefined ? input.title.trim() : item.title,
    description: input.description !== undefined ? input.description.trim() : item.description,
    category: input.category !== undefined ? input.category : item.category,
    sortOrder: input.sortOrder !== undefined ? input.sortOrder : item.sortOrder,
    imageUrls: input.imageUrls !== undefined ? nextUrls : item.imageUrls,
  };

  store.items[idx] = next;
  await writeStore(store);
  return next;
}

export async function appendPortfolioItemImages(
  id: string,
  images: { buffer: Buffer; mimeType: string }[],
): Promise<PortfolioItem | null> {
  if (!images.length) {
    throw new Error("Selecciona al menos una imagen.");
  }

  for (const img of images) {
    if (img.buffer.length > MAX_BYTES_PER_FILE) {
      throw new Error("Cada imagen debe ser de 12 MB o menos.");
    }
    if (!mimeToExt(img.mimeType)) {
      throw new Error("Tipo de imagen no permitido (usa JPG, PNG, WebP o GIF).");
    }
  }

  if (useSupabase()) {
    const supabase = createServerClient()!;
    const { data: row, error: fetchError } = await supabase
      .from("portfolio_items")
      .select("media_url, image_urls")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !row) {
      return null;
    }

    const prevUrls: string[] =
      row.image_urls && row.image_urls.length > 0
        ? row.image_urls
        : row.media_url
          ? [row.media_url]
          : [];

    if (prevUrls.length + images.length > MAX_IMAGES_PER_ITEM) {
      throw new Error(`Máximo ${MAX_IMAGES_PER_ITEM} imágenes por trabajo.`);
    }

    const uploadedPaths: string[] = [];
    const newUrls: string[] = [];
    try {
      for (const img of images) {
        const ext = mimeToExt(img.mimeType)!;
        const objectPath = `items/${id}/${randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(objectPath, img.buffer, {
            contentType: img.mimeType,
            upsert: false,
          });
        if (uploadError) {
          console.error(uploadError);
          throw new Error("No se pudo subir una imagen.");
        }
        uploadedPaths.push(objectPath);
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
        newUrls.push(pub.publicUrl);
      }

      const merged = [...prevUrls, ...newUrls];
      const { data: updated, error: upError } = await supabase
        .from("portfolio_items")
        .update({
          image_urls: merged,
          media_url: merged[0] ?? null,
        })
        .eq("id", id)
        .select(PORTFOLIO_SELECT_WITH_GALLERY)
        .maybeSingle();

      if (upError || !updated) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
        console.error(upError);
        throw new Error("No se pudo guardar las imágenes.");
      }
      return mapRowToItem(updated as PortfolioRow);
    } catch (e) {
      if (uploadedPaths.length) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
      }
      throw e;
    }
  }

  assertFsPortfolioAllowed();
  const store = await readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return null;
  }
  const item = store.items[idx]!;
  if (item.imageUrls.length + images.length > MAX_IMAGES_PER_ITEM) {
    throw new Error(`Máximo ${MAX_IMAGES_PER_ITEM} imágenes por trabajo.`);
  }

  const newUrls: string[] = [];
  for (const img of images) {
    const ext = mimeToExt(img.mimeType)!;
    const filename = `${id}-${randomUUID()}.${ext}`;
    const publicPath = `/uploads/portfolio/${filename}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, img.buffer);
    newUrls.push(publicPath);
  }

  const merged = [...item.imageUrls, ...newUrls];
  const next: PortfolioItem = { ...item, imageUrls: merged };
  store.items[idx] = next;
  await writeStore(store);
  return next;
}

export async function reorderPortfolioItems(orderedIds: string[]): Promise<void> {
  if (!orderedIds.length) {
    return;
  }
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (seen.has(id)) {
      throw new Error("Lista de ids duplicada.");
    }
    seen.add(id);
  }

  if (useSupabase()) {
    const supabase = createServerClient()!;
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]!;
      const { error } = await supabase.from("portfolio_items").update({ sort_order: i }).eq("id", id);
      if (error) {
        console.error(error);
        throw new Error("No se pudo guardar el orden.");
      }
    }
    return;
  }

  assertFsPortfolioAllowed();
  const store = await readStore();
  const byId = new Map(store.items.map((it) => [it.id, it]));
  if (orderedIds.some((id) => !byId.has(id))) {
    throw new Error("Falta alguna entrada del portfolio.");
  }
  if (orderedIds.length !== store.items.length) {
    throw new Error("El orden debe incluir todas las entradas.");
  }
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]!;
    const item = byId.get(id)!;
    item.sortOrder = i;
  }
  store.items = orderedIds.map((id) => byId.get(id)!);
  await writeStore(store);
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
