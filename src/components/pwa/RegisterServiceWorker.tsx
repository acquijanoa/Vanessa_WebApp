"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        /* non-fatal in dev */
      });
  }, []);
  return null;
}
