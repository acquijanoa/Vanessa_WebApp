const equipment = [
  { name: "Cámara — FX6", cat: "Cámara", rate: "180 € / día", status: "Disponible" },
  { name: "Panel LED 2×1", cat: "Iluminación", rate: "95 € / día", status: "En renta" },
  { name: "Dolly + raíles", cat: "Grip", rate: "120 € / día", status: "Disponible" },
];

export default function AdminEquipmentPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Inventario con seguimiento de rentas; enlaza a <code className="text-foreground">equipment_rentals</code>.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card/80 text-muted">
            <tr>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Tarifa</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((e) => (
              <tr key={e.name} className="border-t border-border">
                <td className="px-4 py-3">{e.name}</td>
                <td className="px-4 py-3 text-muted">{e.cat}</td>
                <td className="px-4 py-3">{e.rate}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.status === "En renta"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
