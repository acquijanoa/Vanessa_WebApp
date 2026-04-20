"use client";

import { buildShortlistPdf } from "@/lib/shortlist-pdf";

const shortlist = [
  { name: "Elena V.", heightCm: 176, skills: ["Editorial", "Runway"] },
  { name: "Sofía M.", heightCm: 170, skills: ["Beauty", "Bridal"] },
];

export default function ShortlistsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Shortlists por proyecto para cotización. Exporta un PDF listo para compartir por WhatsApp.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/40 p-6">
        <div>
          <h3 className="font-serif-display text-lg">Campaña primavera 2026</h3>
          <p className="text-sm text-muted">{shortlist.length} modelos en carpeta</p>
        </div>
        <button
          type="button"
          className="border border-accent bg-accent px-5 py-2.5 text-sm font-medium text-background transition hover:bg-transparent hover:text-accent"
          onClick={() =>
            buildShortlistPdf(shortlist, "Campaña primavera 2026")
          }
        >
          PDF en un clic
        </button>
      </div>
      <ul className="space-y-3 text-sm">
        {shortlist.map((m) => (
          <li
            key={m.name}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <span>{m.name}</span>
            <span className="text-muted">
              {m.heightCm} cm · {m.skills.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
