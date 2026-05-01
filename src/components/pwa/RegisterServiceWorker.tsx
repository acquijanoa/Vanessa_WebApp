"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    const reloadOnControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        reg.update().catch(() => {});
        // After the first visit, a controller exists; reload once when a new worker takes over
        // so deploys are not stuck on cached HTML/CSS from an older build.
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            reloadOnControllerChange,
          );
        }
      })
      .catch(() => {
        /* non-fatal in dev */
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        reloadOnControllerChange,
      );
    };
  }, []);
  return null;
}
