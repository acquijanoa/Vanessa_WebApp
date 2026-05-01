import { SiteHeader } from "@/components/layout/SiteHeader";
import { ContentProtectionProvider } from "@/components/protection/ContentProtectionProvider";
import { ProtectedCanvasImage } from "@/components/protection/ProtectedCanvasImage";

const demoUser = "Cliente verificado (demo)";

export default function ClientModelsPage() {
  const watermarkedSrc = `/api/media/watermark?file=globe.svg&user=${encodeURIComponent(demoUser)}`;

  return (
    <>
      <SiteHeader />
      <ContentProtectionProvider active>
        <main className="mx-auto max-w-4xl flex-1 px-6 py-16">
          <h1 className="font-serif-display text-4xl">Selección de modelos — vista cliente</h1>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            Espacio para que producción y cliente revisen fichas con protección básica. Las imágenes
            llevan marca de agua dinámica y se muestran en canvas para dificultar el guardado directo;
            no sustituyen políticas legales ni DRM completo.
          </p>
          <div className="mt-10 rounded-xl border border-border bg-card/40 p-6">
            <p className="text-xs uppercase tracking-widest text-accent">Comp card (demo)</p>
            <div className="mt-6 flex justify-center">
              <ProtectedCanvasImage
                src={watermarkedSrc}
                alt="Comp card con marca de agua"
                className="max-w-md"
              />
            </div>
          </div>
        </main>
      </ContentProtectionProvider>
    </>
  );
}
