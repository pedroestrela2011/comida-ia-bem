import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { scaleIngredient } from "@/lib/scale-ingredient";
import { downloadBlob } from "@/lib/download-blob";

export type AdaptedShopping = { semanal?: Record<string, string[]>; mensal_estoque?: string[] };

export function adaptedShoppingRows(list: AdaptedShopping, checked: Record<string, boolean>, portions: number) {
  const groups = Object.entries(list.semanal || {}).map(([category, items]) => ({ category, items, period: "Semanal" }));
  groups.push({ category: "estoque", items: list.mensal_estoque || [], period: "Estoque mensal" });
  return groups.flatMap(({ category, items, period }) => items.map((item) => {
    const scaled = scaleIngredient(item, portions);
    const quantity = scaled.match(/(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(?:kg|g|mg|ml|l\b|xícaras?|colheres?(?: de (?:sopa|chá))?|unidades?|fatias?|ovos?|pacotes?|latas?)?/i)?.[0]?.trim();
    return { item: scaled, quantity: quantity || (/a gosto/i.test(item) ? "A gosto" : "Não informada"), checked: Boolean(checked[`${category}::${item}`]), category, period };
  }));
}

export function buildAdaptedShoppingPDF(list: AdaptedShopping, checked: Record<string, boolean>, portions: number, labels: Record<string, string>) {
  const doc = new jsPDF();
  const rows = adaptedShoppingRows(list, checked, portions);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ComaFacil", 15, 18);
  doc.setFontSize(13);
  doc.text("Dieta adaptada - Lista de compras", 15, 27);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${portions} ${portions === 1 ? "porção" : "porções"} | ${rows.filter((r) => r.checked).length} de ${rows.length} itens comprados`, 15, 35);
  doc.setFontSize(8);
  doc.text("Quantidades proporcionais à lista original (base: 1 porção).", 15, 41);
  autoTable(doc, {
    startY: 47,
    head: [["Comprado", "Item", "Quantidade", "Categoria / período"]],
    body: rows.map((row) => [row.checked ? "Sim [X]" : "Não [ ]", row.item, row.quantity, `${labels[row.category] || row.category}\n${row.period}`]),
    styles: { fontSize: 9, cellPadding: 3 },
    theme: "grid",
    margin: { top: 15, bottom: 20 },
    rowPageBreak: "avoid",
  });
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`${new Date().toLocaleDateString("pt-BR")} | ComaFacil | ${page} de ${doc.getNumberOfPages()}`, 15, 287);
  }
  return doc;
}

export function exportAdaptedShoppingPDF(list: AdaptedShopping, checked: Record<string, boolean>, portions: number, labels: Record<string, string>) {
  downloadBlob(buildAdaptedShoppingPDF(list, checked, portions, labels).output("blob"), `comafacil-dieta-lista-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
}