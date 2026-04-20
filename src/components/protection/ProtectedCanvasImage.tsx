"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Renders image to canvas so "Save image as" on the img element is not available */
  useCanvas?: boolean;
};

/**
 * Displays a raster image inside a canvas (no underlying &lt;img src&gt; in DOM for that asset).
 * Combine with server watermarks for verified client views.
 */
export function ProtectedCanvasImage({ src, alt, className, useCanvas = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useCanvas) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => setError("No se pudo cargar la imagen.");
    img.src = src;
  }, [src, useCanvas]);

  if (!useCanvas) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} draggable={false} />;
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        aria-label={alt}
        role="img"
        className="h-auto max-h-[80vh] w-full object-contain select-none"
        style={{ touchAction: "none" }}
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
