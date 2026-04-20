import type { PortfolioItem } from "@/lib/portfolio-types";
import { PortfolioInteractiveGrid } from "@/components/portfolio/PortfolioInteractiveGrid";
import { PortfolioContactSection } from "@/components/portfolio/PortfolioContactSection";

type Props = {
  items: PortfolioItem[];
};

export function PortfolioShowcase({ items }: Props) {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16 max-w-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-accent">Portfolio</p>
        <h2 className="font-serif-display mt-3 text-4xl leading-tight md:text-5xl">
          Dirección de imagen con precisión artesanal
        </h2>
        <p className="mt-4 text-sm text-muted">
          Trabajos publicados desde el panel de administración. Pulsa una tarjeta para ver la
          galería completa.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="border border-dashed border-border py-16 text-center text-sm text-muted">
          Próximamente nuevos trabajos aquí.
        </p>
      ) : (
        <PortfolioInteractiveGrid items={items} />
      )}

      <PortfolioContactSection />
    </section>
  );
}
