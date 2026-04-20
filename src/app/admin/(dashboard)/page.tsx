import { StatCard } from "@/components/admin/StatCard";
import Link from "next/link";

const upcoming = [
  { title: "Editorial beauty — estudio Norte", when: "24 abr · 09:00", status: "Confirmado" },
  { title: "Prueba de caracterización FX", when: "28 abr · 15:30", status: "Hold" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Solicitudes nuevas" value={3} hint="Talentos pendientes de revisión" />
        <StatCard label="Reservas próximas" value={5} hint="Próximos 14 días" />
        <StatCard label="Equipo en renta" value={8} hint="Ítems fuera de almacén" />
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif-display text-xl">Próximas reservas</h2>
          <Link href="/admin/locations" className="text-xs text-accent hover:underline">
            Ver calendario
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((row) => (
                <tr key={row.title} className="border-t border-border">
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3 text-muted">{row.when}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
