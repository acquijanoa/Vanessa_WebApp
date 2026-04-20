import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import type { PortfolioCategory, PortfolioItem } from "@/lib/portfolio-types";

const DATA_FILE = path.join(process.cwd(), "data", "portfolio-items.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "portfolio");

type Store = { items: PortfolioItem[] };

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

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
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

export async function removePortfolioItem(id: string): Promise<boolean> {
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
