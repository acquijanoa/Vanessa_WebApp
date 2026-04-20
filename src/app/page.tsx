import { SiteHeader } from "@/components/layout/SiteHeader";
import { PortfolioShowcase } from "@/components/portfolio/PortfolioShowcase";
import { VideoReelPlaceholder } from "@/components/portfolio/VideoReelPlaceholder";
import { getPortfolioItems } from "@/lib/portfolio-data";
import Link from "next/link";

/** Leer portfolio desde disco en cada request para reflejar publicaciones del admin sin rebuild. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const portfolioItems = await getPortfolioItems();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Maquillaje &amp; Producción</p>
          <h1 className="font-serif-display mt-6 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Imagen impecable para cámara, campaña y evento.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            Hub creativo para dirección de maquillaje, casting y logística de rodaje — con
            privacidad y control para talento y clientes.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/#work"
              className="inline-flex items-center justify-center border border-accent bg-accent px-8 py-3 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent"
            >
              Ver categorías
            </Link>
            <Link
              href="/talent/apply"
              className="inline-flex items-center justify-center border border-border px-8 py-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              Registro talento
            </Link>
          </div>
        </section>
        <VideoReelPlaceholder />
        <PortfolioShowcase items={portfolioItems} />
        <footer className="border-t border-border py-16 text-center text-xs text-muted">
          © {new Date().getFullYear()} Vanessa Quijano — Maquillaje y Producción
        </footer>
      </main>
    </>
  );
}
