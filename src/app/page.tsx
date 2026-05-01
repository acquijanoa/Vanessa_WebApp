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
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            Maquillaje · Producción · Locaciones &amp; talento
          </p>
          <h1 className="font-serif-display mt-6 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Más de 15 años de maquillaje profesional para cámara, campaña y producción.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            Dirección de imagen para cámara y campaña, scouting de locaciones, casting de modelos y
            logística de rodaje — con áreas privadas para talento y clientes.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/#work"
              className="inline-flex items-center justify-center border border-accent bg-accent px-8 py-3 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent"
            >
              Ver portfolio
            </Link>
            <Link
              href="/talent/apply"
              className="inline-flex items-center justify-center border border-border px-8 py-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              Registro de modelos
            </Link>
            <Link
              href="/client/models"
              className="inline-flex items-center justify-center border border-border px-8 py-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              Área cliente
            </Link>
          </div>
        </section>
        <section className="border-y border-border bg-card/25">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3 md:gap-10">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Maquillaje</p>
              <h2 className="font-serif-display mt-3 text-2xl leading-snug">
                Experiencia editorial y evento
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Más de quince años creando looks para shoot, pasarela y producción audiovisual, con
                criterio limpio frente a cámara.
              </p>
              <Link
                href="/#work"
                className="mt-4 inline-block text-sm text-accent underline-offset-4 hover:underline"
              >
                Ver trabajos
              </Link>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Producción</p>
              <h2 className="font-serif-display mt-3 text-2xl leading-snug">
                Rodaje y equipo coordinado
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Apoyo en la puesta en escena: timing de set, comunicación con equipo y contenido en
                formato vertical cuando el proyecto lo pide.
              </p>
              <Link
                href="/#reel"
                className="mt-4 inline-block text-sm text-accent underline-offset-4 hover:underline"
              >
                Bloque video
              </Link>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Locaciones &amp; modelos</p>
              <h2 className="font-serif-display mt-3 text-2xl leading-snug">
                Scouting, casting y selección
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Búsqueda de espacios, fichas de talento y vista protegida para que el cliente elija
                perfiles con tranquilidad.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/talent/apply" className="text-accent underline-offset-4 hover:underline">
                  Registro talento
                </Link>
                <Link
                  href="/client/models"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  Área cliente
                </Link>
              </div>
            </div>
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
