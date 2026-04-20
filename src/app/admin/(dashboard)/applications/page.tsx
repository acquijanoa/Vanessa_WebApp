"use client";

import { useState } from "react";

type Application = {
  id: string;
  name: string;
  submitted: string;
  height: string;
  status: "pending" | "approved" | "rejected";
};

const seed: Application[] = [
  {
    id: "1",
    name: "María López",
    submitted: "2026-04-18",
    height: "174 cm",
    status: "pending",
  },
  {
    id: "2",
    name: "Ana Ruiz",
    submitted: "2026-04-17",
    height: "168 cm",
    status: "pending",
  },
];

export default function ApplicationsPage() {
  const [rows, setRows] = useState(seed);

  function setStatus(id: string, status: "approved" | "rejected") {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Aprueba o rechaza solicitudes de talento. En producción, esta vista lee{" "}
        <code className="text-foreground">talent_applications</code> vía Supabase.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card/80 text-muted">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Altura</th>
              <th className="px-4 py-3">Enviado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.height}</td>
                <td className="px-4 py-3 text-muted">{r.submitted}</td>
                <td className="px-4 py-3 capitalize text-muted">{r.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-emerald-900/40 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-900/60"
                      onClick={() => setStatus(r.id, "approved")}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-900/30 px-3 py-1 text-xs text-red-200 hover:bg-red-900/50"
                      onClick={() => setStatus(r.id, "rejected")}
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
