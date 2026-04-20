import { SiteHeader } from "@/components/layout/SiteHeader";

export default function TalentApplyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif-display text-4xl">Registro de talento</h1>
        <p className="mt-4 text-sm text-muted">
          Envía tus medidas, digitales y notas. Un administrador revisará tu solicitud antes de
          publicar tu perfil.
        </p>
        <form className="mt-12 space-y-8" action="#" method="post">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Nombre completo</span>
              <input
                name="fullName"
                required
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Altura (cm)</span>
              <input
                name="height"
                type="number"
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted">Tallas (ropa / zapato)</span>
            <textarea
              name="sizes"
              rows={3}
              className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Ej. vestido 38, zapato 39 EU"
            />
          </label>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Tono de piel</span>
              <input
                name="skin"
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Color de ojos</span>
              <input
                name="eyes"
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted">Skills relevantes</span>
            <input
              name="skills"
              className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Ej. pasarela, beauty, FX ligero"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Enlaces a digitales (URLs)</span>
            <textarea
              name="digitals"
              rows={3}
              className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Sube archivos a tu drive y pega enlaces privados, o integra Supabase Storage."
            />
          </label>
          <button
            type="submit"
            className="border border-accent bg-accent px-8 py-3 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent"
          >
            Enviar solicitud
          </button>
        </form>
      </main>
    </>
  );
}
