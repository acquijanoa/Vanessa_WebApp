"use client";

import type { PortfolioItem } from "@/lib/portfolio-types";
import { CATEGORY_LABELS, PORTFOLIO_CATEGORIES, portfolioCoverUrl } from "@/lib/portfolio-types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type EntryEditorProps = {
  item: PortfolioItem;
  onUpdated: (item: PortfolioItem) => void;
  onError: (msg: string | null) => void;
  onMoveEntry: (id: string, dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

function PortfolioEntryEditor({
  item,
  onUpdated,
  onError,
  onMoveEntry,
  canMoveUp,
  canMoveDown,
}: EntryEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category);
  const [urls, setUrls] = useState<string[]>(() => [...item.imageUrls]);
  const [pending, setPending] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setUrls([...item.imageUrls]);
  }, [item]);

  async function saveMetaAndImages() {
    setPending(true);
    onError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          imageUrls: urls,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; item?: PortfolioItem };
      if (!res.ok || !data.item) {
        onError(data.error ?? "No se pudo guardar.");
        return;
      }
      onUpdated(data.item);
    } catch {
      onError("Error de red.");
    } finally {
      setPending(false);
    }
  }

  async function appendNewFiles() {
    if (addFiles.length === 0) {
      return;
    }
    setPending(true);
    onError(null);
    try {
      const fd = new FormData();
      for (const f of addFiles) {
        fd.append("images", f);
      }
      const res = await fetch(`/api/admin/portfolio/${item.id}/images`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; item?: PortfolioItem };
      if (!res.ok || !data.item) {
        onError(data.error ?? "No se pudieron subir las imágenes.");
        return;
      }
      setAddFiles([]);
      onUpdated(data.item);
    } catch {
      onError("Error de red.");
    } finally {
      setPending(false);
    }
  }

  async function removeAt(index: number) {
    setRemovingIndex(index);
    onError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${item.id}/images?index=${index}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; item?: PortfolioItem };
      if (!res.ok || !data.item) {
        onError(data.error ?? "No se pudo eliminar la imagen.");
        return;
      }
      onUpdated(data.item);
    } catch {
      onError("Error de red.");
    } finally {
      setRemovingIndex(null);
    }
  }

  function setCoverAt(index: number) {
    if (index <= 0) {
      return;
    }
    const next = [...urls];
    const [picked] = next.splice(index, 1);
    if (picked) {
      next.unshift(picked);
      setUrls(next);
    }
  }

  function moveImage(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= urls.length) {
      return;
    }
    const next = [...urls];
    const t = next[i]!;
    next[i] = next[j]!;
    next[j] = t;
    setUrls(next);
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canMoveUp || pending}
          onClick={() => onMoveEntry(item.id, -1)}
          className="border border-border bg-background px-2 py-1 text-xs text-foreground hover:border-accent disabled:opacity-40"
        >
          Subir entrada
        </button>
        <button
          type="button"
          disabled={!canMoveDown || pending}
          onClick={() => onMoveEntry(item.id, 1)}
          className="border border-border bg-background px-2 py-1 text-xs text-foreground hover:border-accent disabled:opacity-40"
        >
          Bajar entrada
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            {PORTFOLIO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-muted">Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="text-xs text-muted">
          Imágenes (la primera es la portada en la web). Reordena o elige portada antes de guardar.
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <li
              key={`${u}-${i}`}
              className="relative flex w-[88px] flex-col gap-1 border border-border bg-zinc-950/40 p-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-[4/5] w-full object-cover" />
              {i === 0 ? (
                <span className="text-center text-[10px] text-accent">Portada</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCoverAt(i)}
                  className="text-[10px] text-muted underline hover:text-accent"
                >
                  Usar como portada
                </button>
              )}
              <div className="flex justify-center gap-0.5">
                <button
                  type="button"
                  disabled={i === 0 || pending}
                  onClick={() => moveImage(i, -1)}
                  className="px-1 text-[10px] text-foreground hover:text-accent disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={i >= urls.length - 1 || pending}
                  onClick={() => moveImage(i, 1)}
                  className="px-1 text-[10px] text-foreground hover:text-accent disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={urls.length <= 1 || removingIndex === i || pending}
                  onClick={() => void removeAt(i)}
                  className="px-1 text-[10px] text-red-400 hover:underline disabled:opacity-30"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="text-muted">Añadir imágenes</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setAddFiles(Array.from(e.target.files ?? []))}
            className="mt-1 w-full text-xs text-muted file:mr-2 file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-foreground"
          />
        </label>
        <button
          type="button"
          disabled={addFiles.length === 0 || pending}
          onClick={() => void appendNewFiles()}
          className="border border-border bg-card px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
        >
          Subir nuevas
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => void saveMetaAndImages()}
        className="border border-accent bg-accent px-4 py-2 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios de esta entrada"}
      </button>
    </div>
  );
}

export function PortfolioAdminClient({ initialItems }: { initialItems: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<(typeof PORTFOLIO_CATEGORIES)[number]>(
    "social_celebraciones",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (files.length === 0) {
      setFilePreviews([]);
      setCoverIndex(0);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    setCoverIndex((i) => Math.min(i, files.length - 1));
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError("Selecciona al menos una imagen.");
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("title", title);
      fd.set("description", description);
      fd.set("coverIndex", String(coverIndex));
      for (const f of files) {
        fd.append("images", f);
      }

      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; item?: PortfolioItem };
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar.");
        return;
      }
      setTitle("");
      setDescription("");
      setFiles([]);
      setCoverIndex(0);
      await refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta entrada del portfolio?")) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      await refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setDeletingId(null);
    }
  }

  function replaceItem(next: PortfolioItem) {
    setItems((prev) => prev.map((i) => (i.id === next.id ? next : i)));
  }

  async function moveEntryInList(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= items.length) {
      return;
    }
    const next = [...items];
    const t = next[idx]!;
    next[idx] = next[j]!;
    next[j] = t;
    setItems(next);
    setReordering(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portfolio/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; items?: PortfolioItem[] };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el orden.");
        await refresh();
        return;
      }
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      setError("Error de red.");
      await refresh();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="max-w-xl rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif-display text-xl">Publicar trabajo</h2>
        <p className="mt-2 text-sm text-muted">
          Sube una o varias imágenes y elige cuál será la portada en la página principal. Título y
          descripción obligatorios.
        </p>
        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="text-muted">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            >
              {PORTFOLIO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Ej. Editorial otoño"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Concepto, técnica, créditos breves…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">
              Imágenes (JPG, PNG, WebP o GIF; máx. 12 MB cada una; hasta 12 archivos)
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setFiles(list);
              }}
              className="mt-2 w-full text-sm text-muted file:mr-3 file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-foreground"
            />
            {files.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted">Portada en la web (elige una):</p>
                <div className="flex flex-wrap gap-3">
                  {files.map((file, i) => (
                    <label
                      key={`${file.name}-${i}`}
                      className={`flex cursor-pointer flex-col items-center gap-1 border p-1 ${
                        coverIndex === i ? "border-accent" : "border-border"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviews[i] ?? ""}
                        alt=""
                        className="h-20 w-16 object-cover"
                      />
                      <input
                        type="radio"
                        name="cover"
                        checked={coverIndex === i}
                        onChange={() => setCoverIndex(i)}
                        className="sr-only"
                      />
                      <span className="text-[10px] text-muted">{i + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="border border-accent bg-accent px-6 py-2.5 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent disabled:opacity-60"
          >
            {pending ? "Publicando…" : "Publicar en el sitio"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-serif-display text-xl">Entradas actuales</h2>
        <p className="mt-2 text-sm text-muted">
          Orden de las entradas en la web (arriba = antes en cada categoría). Edita texto, portada y
          galería por entrada.
        </p>
        {reordering ? (
          <p className="mt-2 text-xs text-muted">Guardando orden…</p>
        ) : null}
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Aún no hay trabajos publicados.</p>
        ) : (
          <ul className="mt-6 space-y-6">
            {items.map((item, idx) => (
              <li key={item.id} className="border border-border bg-card/30 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={portfolioCoverUrl(item)}
                    alt=""
                    className="h-28 w-28 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-widest text-accent">
                      {CATEGORY_LABELS[item.category]}
                    </p>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted">{item.description}</p>
                    <p className="mt-2 text-xs text-muted">
                      {item.imageUrls.length} imagen{item.imageUrls.length === 1 ? "" : "es"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="shrink-0 text-sm text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Eliminando…" : "Eliminar entrada"}
                  </button>
                </div>
                <PortfolioEntryEditor
                  item={item}
                  onUpdated={replaceItem}
                  onError={setError}
                  onMoveEntry={moveEntryInList}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < items.length - 1}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
