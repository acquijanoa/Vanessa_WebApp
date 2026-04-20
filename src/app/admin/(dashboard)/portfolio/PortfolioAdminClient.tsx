"use client";

import type { PortfolioItem } from "@/lib/portfolio-types";
import { CATEGORY_LABELS, PORTFOLIO_CATEGORIES } from "@/lib/portfolio-types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function PortfolioAdminClient({ initialItems }: { initialItems: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState<(typeof PORTFOLIO_CATEGORIES)[number]>("beauty");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    const data = (await res.json()) as { items: PortfolioItem[] };
    if (data.items) {
      setItems(data.items);
    }
    router.refresh();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona una imagen.");
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("title", title);
      fd.set("description", description);
      fd.set("image", file);

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
      setFile(null);
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

  return (
    <div className="space-y-10">
      <section className="max-w-xl rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif-display text-xl">Publicar trabajo</h2>
        <p className="mt-2 text-sm text-muted">
          Sube una imagen y escribe título y descripción. Aparecerá en la página principal agrupada
          por categoría.
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
            <span className="text-muted">Imagen (JPG, PNG, WebP o GIF, máx. 12 MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 w-full text-sm text-muted file:mr-3 file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-foreground"
            />
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
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Aún no hay trabajos publicados.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 border border-border bg-card/30 p-4 sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-24 w-24 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest text-accent">
                    {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="shrink-0 text-sm text-red-400 hover:underline disabled:opacity-50"
                >
                  {deletingId === item.id ? "Eliminando…" : "Eliminar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
