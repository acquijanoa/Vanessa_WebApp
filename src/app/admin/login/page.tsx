import { Suspense } from "react";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 text-sm text-muted">
          Cargando…
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
