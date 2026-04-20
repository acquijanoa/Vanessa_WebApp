import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function TalentApplyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const banner =
    sp.ok === "1" ? (
      <div className="mb-8 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
        Gracias: hemos recibido tu solicitud. Te contactaremos si encajas en un proyecto.
      </div>
    ) : sp.error === "validacion" ? (
      <div className="mb-8 rounded-lg border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        Revisa el formulario: el nombre completo es obligatorio.
      </div>
    ) : sp.error === "config" ? (
      <div className="mb-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100">
        El envío no está disponible ahora (falta configuración del servidor). Vuelve a intentar más
        tarde o escribe por los canales habituales del estudio.
      </div>
    ) : sp.error === "servidor" ? (
      <div className="mb-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100">
        No se pudo guardar tu solicitud. Inténtalo de nuevo en unos minutos.
      </div>
    ) : sp.error === "form" ? (
      <div className="mb-8 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100">
        El envío no se pudo procesar. Recarga la página e inténtalo otra vez.
      </div>
    ) : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif-display text-4xl">Registro de talento</h1>
        <p className="mt-4 text-sm text-muted">
          Envía tus medidas, digitales y notas. Un administrador revisará tu solicitud antes de
          publicar tu perfil.
        </p>

        {banner}

        <form className="mt-12 space-y-8" action="/api/talent/apply" method="post">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Nombre completo</span>
              <input
                name="fullName"
                required
                autoComplete="name"
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Altura (cm)</span>
              <input
                name="height"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
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
              placeholder="Ej. pasarela, maquillaje social, caracterización"
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

        <p className="mt-10 text-center text-xs text-muted">
          <Link href="/" className="underline hover:text-foreground">
            Volver al inicio
          </Link>
        </p>
      </main>
    </>
  );
}
