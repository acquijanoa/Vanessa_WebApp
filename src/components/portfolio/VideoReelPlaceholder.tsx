export function VideoReelPlaceholder() {
  return (
    <section id="reel" className="border-y border-border bg-stone-50/80 scroll-mt-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Producción</p>
          <h2 className="font-serif-display mt-3 text-3xl md:text-4xl">Reels y contenido en rodaje</h2>
          <p className="mt-4 max-w-md text-sm text-muted">
            Aquí puedes integrar tu reel de backstage, campaña o vertical para redes (Mux, Vimeo o
            archivo propio). Refuerza la parte de producción junto al portfolio de maquillaje.
          </p>
        </div>
        <div className="aspect-[9/16] w-full max-w-[220px] rounded-lg border border-border bg-gradient-to-b from-stone-200 to-stone-300 shadow-lg shadow-stone-900/5">
          <div className="flex h-full items-center justify-center text-xs text-muted">
            9:16
          </div>
        </div>
      </div>
    </section>
  );
}
