import type { PortfolioCategory, PortfolioItem } from "@/lib/portfolio-types";
import { CATEGORY_LABELS } from "@/lib/portfolio-types";

const categoryOrder: PortfolioCategory[] = ["fx", "bridal", "beauty"];

function groupByCategory(items: PortfolioItem[]): Record<PortfolioCategory, PortfolioItem[]> {
  const empty: Record<PortfolioCategory, PortfolioItem[]> = {
    fx: [],
    bridal: [],
    beauty: [],
  };
  for (const item of items) {
    empty[item.category].push(item);
  }
  return empty;
}

type Props = {
  items: PortfolioItem[];
};

export function PortfolioShowcase({ items }: Props) {
  const grouped = groupByCategory(items);

  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16 max-w-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-accent">Portfolio</p>
        <h2 className="font-serif-display mt-3 text-4xl leading-tight md:text-5xl">
          Dirección de imagen con precisión artesanal
        </h2>
        <p className="mt-4 text-sm text-muted">
          Trabajos publicados desde el panel de administración.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="border border-dashed border-border py-16 text-center text-sm text-muted">
          Próximamente nuevos trabajos aquí.
        </p>
      ) : (
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
                    <article
                      key={item.id}
                      className="flex flex-col overflow-hidden border border-border bg-card/40"
                    >
                      <div className="relative aspect-[4/5] w-full bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h4 className="font-serif-display text-xl leading-snug">{item.title}</h4>
                        {item.description ? (
                          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
