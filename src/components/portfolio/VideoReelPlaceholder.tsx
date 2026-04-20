export function VideoReelPlaceholder() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Motion</p>
          <h2 className="font-serif-display mt-3 text-3xl md:text-4xl">Reels &amp; shorts</h2>
          <p className="mt-4 max-w-md text-sm text-muted">
            Integración de video vertical optimizado para redes. Sustituye este bloque por tu
            reproductor (Mux, Vimeo o archivo propio).
          </p>
        </div>
        <div className="aspect-[9/16] w-full max-w-[220px] rounded-lg border border-border bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl">
          <div className="flex h-full items-center justify-center text-xs text-muted">
            9:16
          </div>
        </div>
      </div>
    </section>
  );
}
