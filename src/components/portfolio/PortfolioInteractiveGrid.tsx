"use client";

import type { PortfolioCategory, PortfolioItem } from "@/lib/portfolio-types";
import {
  CATEGORY_LABELS,
  PORTFOLIO_CATEGORIES,
  isPortfolioCategory,
  portfolioCoverUrl,
} from "@/lib/portfolio-types";
import { useCallback, useEffect, useId, useState } from "react";

const categoryOrder: PortfolioCategory[] = [...PORTFOLIO_CATEGORIES];

function groupByCategory(items: PortfolioItem[]): Record<PortfolioCategory, PortfolioItem[]> {
  const empty = PORTFOLIO_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = [];
      return acc;
    },
    {} as Record<PortfolioCategory, PortfolioItem[]>,
  );
  const fallback: PortfolioCategory = "social_celebraciones";
  for (const item of items) {
    const cat = isPortfolioCategory(item.category) ? item.category : fallback;
    empty[cat].push(item);
  }
  return empty;
}

type LightboxProps = {
  item: PortfolioItem;
  onClose: () => void;
};

function PortfolioLightbox({ item, onClose }: LightboxProps) {
  const urls = item.imageUrls.length ? item.imageUrls : [""];
  const [index, setIndex] = useState(0);
  const titleId = useId();

  const safeIndex = Math.min(index, Math.max(0, urls.length - 1));
  const current = urls[safeIndex] ?? "";

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? urls.length - 1 : i - 1));
  }, [urls.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));
  }, [urls.length]);

  useEffect(() => {
    setIndex(0);
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowLeft") {
        goPrev();
      }
      if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/75 backdrop-blur-md"
        onClick={onClose}
        aria-label="Cerrar galería"
      />
      <div
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-zinc-950/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt=""
            className="max-h-[min(70vh,720px)] w-full object-contain"
          />

          {urls.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow backdrop-blur transition hover:bg-background"
                aria-label="Imagen anterior"
              >
                <span className="text-lg" aria-hidden>
                  ‹
                </span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow backdrop-blur transition hover:bg-background"
                aria-label="Imagen siguiente"
              >
                <span className="text-lg" aria-hidden>
                  ›
                </span>
              </button>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted backdrop-blur">
                {safeIndex + 1} / {urls.length}
              </p>
            </>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow backdrop-blur transition hover:bg-background"
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>

        <div className="border-t border-border p-5 sm:p-6">
          <h2 id={titleId} className="font-serif-display text-xl text-foreground sm:text-2xl">
            {item.title}
          </h2>
          {item.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type Props = {
  items: PortfolioItem[];
};

export function PortfolioInteractiveGrid({ items }: Props) {
  const grouped = groupByCategory(items);
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

  return (
    <>
      <div className="space-y-20">
        {categoryOrder.map((cat) => {
          const catItems = grouped[cat];
          if (catItems.length === 0) {
            return null;
          }
          return (
            <div key={cat}>
              <h3 className="font-serif-display text-2xl text-foreground md:text-3xl">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOpenId(item.id)}
                    className="group flex flex-col overflow-hidden border border-border bg-card/40 text-left transition hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="relative aspect-[4/5] w-full bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={portfolioCoverUrl(item)}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:opacity-95"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {item.imageUrls.length > 1 ? (
                        <span className="absolute bottom-2 right-2 rounded bg-background/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted backdrop-blur">
                          {item.imageUrls.length} fotos
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h4 className="font-serif-display text-xl leading-snug group-hover:text-accent">
                        {item.title}
                      </h4>
                      {item.description ? (
                        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                          {item.description}
                        </p>
                      ) : null}
                      <span className="mt-4 text-xs text-accent/90">Ver galería</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {openItem ? <PortfolioLightbox item={openItem} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
