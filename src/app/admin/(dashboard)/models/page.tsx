const models = [
  {
    name: "Elena V.",
    height: "176 cm",
    skin: "Media",
    eyes: "Verde",
    skills: ["Editorial", "Runway"],
    comp: "Front / Back",
  },
  {
    name: "Sofía M.",
    height: "170 cm",
    skin: "Clara",
    eyes: "Azul",
    skills: ["Beauty", "Bridal"],
    comp: "Front / Back",
  },
];

export default function AdminModelsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Base de modelos con medidas y comp cards. Las URLs sensibles deben servirse con marca de
        agua dinámica para clientes verificados.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {models.map((m) => (
          <article key={m.name} className="rounded-xl border border-border bg-card/50 p-6">
            <h3 className="font-serif-display text-xl">{m.name}</h3>
            <dl className="mt-4 space-y-2 text-sm text-muted">
              <div className="flex justify-between gap-4">
                <dt>Altura</dt>
                <dd className="text-foreground">{m.height}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Piel / ojos</dt>
                <dd className="text-foreground">
                  {m.skin} · {m.eyes}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Skills</dt>
                <dd className="text-right text-foreground">{m.skills.join(", ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Comp cards</dt>
                <dd className="text-foreground">{m.comp}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
