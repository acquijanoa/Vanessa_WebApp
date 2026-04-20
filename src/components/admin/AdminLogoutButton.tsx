"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className="mt-8 w-full border-t border-border pt-6 text-left text-sm text-muted transition hover:text-foreground disabled:opacity-50"
    >
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
