import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CATEGORY_LABEL, ShoppingList } from "@/lib/shopping-list";

const GREEN: [number, number, number] = [45, 106, 79]; // #2d6a4f

function drawHeader(doc: jsPDF, pageWidth: number, periodo: string) {
  doc.setFillColor(...GREEN);
  doc.circle(15, 14, 4, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Coma Fácil", 22, 16);

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Lista de Compras", pageWidth / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const linhas = doc.splitTextToSize(periodo, 55);
  doc.text(linhas, pageWidth - 15, 13, { align: "right" });

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

export function buildListaComprasPDF(
  list: ShoppingList,
  periodo: string,
  opts?: { marcarProteina?: boolean }
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  drawHeader(doc, pageWidth, periodo);
  let y = 30;

  for (const grupo of list.byCategory) {
    const body = grupo.items.map((i) => [
      "",
      i.nome + (opts?.marcarProteina && i.altaProteina ? "  (rico em proteína)" : ""),
      [i.quantidade, i.unidade].filter(Boolean).join(" "),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["", CATEGORY_LABEL[grupo.categoria], "Quantidade"]],
      body,
      theme: "grid",
      headStyles: { fillColor: GREEN, textColor: 255, fontSize: 9.5, halign: "left" },
      bodyStyles: { fontSize: 9, textColor: 40, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 32 },
      },
      margin: { left: margin, right: margin, top: 30, bottom: 16 },
      didDrawCell: (data) => {
        // checkbox vazio para marcar no papel
        if (data.section === "body" && data.column.index === 0) {
          const size = 3.4;
          const cx = data.cell.x + (data.cell.width - size) / 2;
          const cy = data.cell.y + (data.cell.height - size) / 2;
          doc.setDrawColor(...GREEN);
          doc.setLineWidth(0.3);
          doc.rect(cx, cy, size, size);
        }
      },
    });
    // @ts-expect-error lastAutoTable adicionado pelo autotable
    y = doc.lastAutoTable.finalY + 6;
  }

  if (list.byCategory.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text("Nenhum ingrediente encontrado no cardápio.", margin, y);
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) drawHeader(doc, pageWidth, periodo);
    drawFooter(doc, pageWidth, pageHeight, i);
  }

  return doc;
}

export function exportListaComprasPDF(
  list: ShoppingList,
  periodo: string,
  opts?: { marcarProteina?: boolean; filename?: string }
) {
  const doc = buildListaComprasPDF(list, periodo, opts);
  doc.save(opts?.filename || `coma-facil-lista-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
}
