import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const nav = [
  { href: "/admin", label: "Resumen", icon: "◆" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "◎" },
  { href: "/admin/applications", label: "Solicitudes", icon: "◇" },
  { href: "/admin/models", label: "Modelos", icon: "○" },
  { href: "/admin/locations", label: "Locaciones", icon: "□" },
  { href: "/admin/equipment", label: "Equipo", icon: "△" },
  { href: "/admin/shortlists", label: "Shortlists", icon: "☆" },
];

export function AdminSidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-border bg-card/80 p-6">
      <Link href="/" className="font-serif-display text-lg text-foreground">
        VQ Admin
      </Link>
      <p className="mt-1 text-xs text-muted">Panel de producción</p>
      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <span className="text-accent" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
      <AdminLogoutButton />
    </aside>
  );
}
