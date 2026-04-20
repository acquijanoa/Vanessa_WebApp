"use client";

import { useEffect } from "react";

/**
 * Best-effort deterrents for casual saving/copying. Browsers cannot fully block
 * screenshots, DevTools, or OS-level capture — treat this as UX friction, not DRM.
 */
export function useContentProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;

      if (key === "f12") {
        e.preventDefault();
      }
      if (isMod && (key === "i" || key === "u" || key === "s" || key === "p")) {
        e.preventDefault();
      }
      if (isMod && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("dragstart", onDragStart);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, [enabled]);
}
