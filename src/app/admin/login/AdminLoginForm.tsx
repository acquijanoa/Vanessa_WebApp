"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";
  const configError = searchParams.get("error") === "config";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const safeNext = nextPath.startsWith("/admin") ? nextPath : "/admin";
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm border border-border bg-card/40 p-8">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-accent">Admin</p>
        <h1 className="font-serif-display mt-3 text-center text-3xl">Acceso al panel</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Introduce usuario y contraseña configurados en el servidor.
        </p>

        {configError ? (
          <p className="mt-4 rounded-md border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-100">
            Falta <code className="text-foreground">ADMIN_JWT_SECRET</code> (mín. 32 caracteres) en{" "}
            <code className="text-foreground">.env.local</code>.
          </p>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="text-muted">Usuario</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Contraseña</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full border border-accent bg-accent py-2.5 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="text-accent hover:underline">
            Volver al sitio
          </Link>
        </p>
      </div>
    </main>
  );
}
