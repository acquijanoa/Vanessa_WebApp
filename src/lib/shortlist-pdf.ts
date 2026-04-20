import { jsPDF } from "jspdf";

export type ShortlistModelRow = {
  name: string;
  heightCm?: number;
  skills?: string[];
};

export function buildShortlistPdf(models: ShortlistModelRow[], projectName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Shortlist — Vanessa Quijano Producción", margin, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Proyecto: ${projectName}`, margin, y);
  y += 14;
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, y);
  y += 36;
  doc.setTextColor(0);

  models.forEach((m, i) => {
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${i + 1}. ${m.name}`, margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines: string[] = [];
    if (m.heightCm) lines.push(`Altura: ${m.heightCm} cm`);
    if (m.skills?.length) lines.push(`Skills: ${m.skills.join(", ")}`);
    lines.forEach((line) => {
      doc.text(line, margin + 8, y);
      y += 14;
    });
    y += 16;
  });

  doc.save(`shortlist-${projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
