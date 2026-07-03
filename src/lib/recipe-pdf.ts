import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReceitaPDF = {
  nome: string;
  descricao?: string;
  tempo_preparo?: string;
  porcoes?: string;
  dificuldade?: string;
  ingredientes?: string[];
  modo_preparo?: string[] | string;
  dicas?: string;
  informacoes_nutricionais?: {
    calorias?: string;
    proteinas?: string;
    carboidratos?: string;
    gorduras?: string;
    fibras?: string;
  };
};

const GREEN: [number, number, number] = [45, 106, 79]; // #2d6a4f
const GREEN_SOFT: [number, number, number] = [240, 247, 240]; // #f0f7f0

function drawHeader(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...GREEN);
  doc.circle(15, 14, 4, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Coma Fácil", 22, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const dateStr = new Date().toLocaleDateString("pt-BR");
  doc.text(dateStr, pageWidth - 15, 16, { align: "right" });

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(15, 22, pageWidth - 15, 22);
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Gerado pelo Coma Fácil — Alimentação inteligente com IA",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.text(String(pageNum), pageWidth - 15, pageHeight - 8, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, needed: number, pageWidth: number, pageHeight: number): number {
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    drawHeader(doc, pageWidth);
    return 30;
  }
  return y;
}

export function buildReceitaPDF(receita: ReceitaPDF): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  drawHeader(doc, pageWidth);
  let y = 32;

  // Nome
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  const nomeLines = doc.splitTextToSize(receita.nome || "Receita", contentWidth);
  doc.text(nomeLines, margin, y);
  y += nomeLines.length * 8 + 2;

  // Descrição
  if (receita.descricao) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    const descLines = doc.splitTextToSize(receita.descricao, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 3;
  }

  // Meta info
  const meta: string[] = [];
  if (receita.tempo_preparo) meta.push(`Tempo: ${receita.tempo_preparo}`);
  if (receita.porcoes) meta.push(`Porções: ${receita.porcoes}`);
  if (receita.dificuldade) meta.push(`Dificuldade: ${receita.dificuldade}`);
  if (meta.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text(meta.join("   •   "), margin, y);
    y += 7;
  }

  // Nutricional
  const info = receita.informacoes_nutricionais;
  if (info && (info.calorias || info.proteinas || info.carboidratos || info.gorduras)) {
    y = ensureSpace(doc, y, 20, pageWidth, pageHeight);
    autoTable(doc, {
      startY: y,
      head: [["Calorias", "Proteínas", "Carboidratos", "Gorduras"]],
      body: [[info.calorias || "-", info.proteinas || "-", info.carboidratos || "-", info.gorduras || "-"]],
      theme: "grid",
      headStyles: { fillColor: GREEN, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: 40 },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 2, halign: "center" },
    });
    // @ts-expect-error autotable
    y = doc.lastAutoTable.finalY + 6;
  }

  // Ingredientes
  if (receita.ingredientes?.length) {
    y = ensureSpace(doc, y, 14, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GREEN);
    doc.text("Ingredientes", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    for (const ing of receita.ingredientes) {
      const lines = doc.splitTextToSize(`•  ${ing}`, contentWidth - 4);
      y = ensureSpace(doc, y, lines.length * 5, pageWidth, pageHeight);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5;
    }
    y += 3;
  }

  // Modo de preparo
  const steps = Array.isArray(receita.modo_preparo)
    ? receita.modo_preparo
    : receita.modo_preparo
    ? [receita.modo_preparo]
    : [];
  if (steps.length) {
    y = ensureSpace(doc, y, 14, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GREEN);
    doc.text("Modo de Preparo", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    steps.forEach((step, i) => {
      const text = `${i + 1}.  ${step}`;
      const lines = doc.splitTextToSize(text, contentWidth - 4);
      y = ensureSpace(doc, y, lines.length * 5 + 2, pageWidth, pageHeight);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    });
    y += 2;
  }

  // Dica
  if (receita.dicas) {
    const dicaLines = doc.splitTextToSize(`Dica: ${receita.dicas}`, contentWidth - 8);
    const boxH = dicaLines.length * 5 + 8;
    y = ensureSpace(doc, y, boxH + 4, pageWidth, pageHeight);
    doc.setFillColor(...GREEN_SOFT);
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 60, 45);
    doc.text(dicaLines, margin + 4, y + 6);
    y += boxH + 4;
  }

  // Footer + page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, pageHeight, i);
  }

  return doc;
}

export function exportReceitaPDF(receita: ReceitaPDF) {
  const doc = buildReceitaPDF(receita);
  const safe = (receita.nome || "receita").toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
  doc.save(`coma-facil-${safe || "receita"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
