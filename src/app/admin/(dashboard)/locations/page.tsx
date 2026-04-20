const locations = [
  {
    name: "Nave 14",
    style: "Industrial",
    m2: 420,
    power: "63 kW trifásico",
    parking: 6,
    restrooms: 2,
    light: "Norte / claraboyas",
  },
  {
    name: "Salón Aurora",
    style: "Vintage",
    m2: 180,
    power: "32 kW",
    parking: 2,
    restrooms: 1,
    light: "Este, luz matinal",
  },
];

export default function AdminLocationsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Locaciones catalogadas por estilo con especificaciones técnicas para producción.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {locations.map((loc) => (
          <article key={loc.name} className="rounded-xl border border-border bg-card/50 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-serif-display text-xl">{loc.name}</h3>
              <span className="text-xs uppercase tracking-widest text-accent">{loc.style}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <span className="text-foreground">{loc.m2} m²</span> útiles
              </li>
              <li>Electricidad: {loc.power}</li>
              <li>
                Parking: {loc.parking} · Baños: {loc.restrooms}
              </li>
              <li>Luz natural: {loc.light}</li>
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
