import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-border px-8 py-6">
          <h1 className="font-serif-display text-2xl">Panel administrativo</h1>
          <p className="text-sm text-muted">
            Datos de demostración — conecta Supabase para persistencia en vivo.
          </p>
        </div>
        <div className="flex-1 p-8">{children}</div>
      </div>
    </div>
  );
}
