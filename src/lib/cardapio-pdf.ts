import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Refeicao = {
  nome: string;
  descricao?: string;
  ingredientes?: string[];
  informacoes_nutricionais?: {
    calorias?: string;
    proteinas?: string;
    carboidratos?: string;
    gorduras?: string;
    fibras?: string;
  };
};
type DiaCardapio = Record<string, Refeicao>;
type CardapioData = { cardapio: Record<string, DiaCardapio>; lista_compras?: string[] };

const DIAS_LABEL_FULL: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

const REFEICOES_ORDER = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"];
const REFEICOES_LABEL: Record<string, string> = {
  cafe_da_manha: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da Tarde",
  jantar: "Jantar",
};

const GREEN: [number, number, number] = [45, 106, 79]; // #2d6a4f

export function getTodayKey(): string {
  const map = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return map[new Date().getDay()];
}

function drawHeader(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...GREEN);
  doc.circle(15, 14, 4, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Coma Fácil", 22, 16);

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Meu Cardápio", pageWidth / 2, 16, { align: "center" });

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

function renderDia(doc: jsPDF, dia: string, dados: DiaCardapio, startY: number, pageWidth: number, pageHeight: number): number {
  let y = startY;
  const margin = 15;

  if (y > pageHeight - 40) {
    doc.addPage();
    y = 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(DIAS_LABEL_FULL[dia] || dia, margin, y);
  y += 6;

  const keys = [
    ...REFEICOES_ORDER.filter((k) => dados[k]),
    ...Object.keys(dados).filter((k) => !REFEICOES_ORDER.includes(k)),
  ];

  for (const key of keys) {
    const ref = dados[key];
    if (!ref) continue;

    if (y > pageHeight - 45) {
      doc.addPage();
      y = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(REFEICOES_LABEL[key] || key, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(ref.nome || "", margin, y);
    y += 5;

    if (ref.ingredientes && ref.ingredientes.length) {
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      const lines = ref.ingredientes.map((i) => `• ${i}`);
      const wrapped = doc.splitTextToSize(lines.join("\n"), pageWidth - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4 + 2;
    }

    const info = ref.informacoes_nutricionais;
    if (info && (info.calorias || info.proteinas || info.carboidratos || info.gorduras)) {
      autoTable(doc, {
        startY: y,
        head: [["Calorias", "Proteínas", "Carboidratos", "Gorduras"]],
        body: [[info.calorias || "-", info.proteinas || "-", info.carboidratos || "-", info.gorduras || "-"]],
        theme: "grid",
        headStyles: { fillColor: GREEN, textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: 40 },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 1.5 },
      });
      // @ts-expect-error lastAutoTable added by autotable
      y = doc.lastAutoTable.finalY + 4;
    } else {
      y += 2;
    }
  }

  // Linha divisória suave
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  return y;
}

export function buildCardapioPDF(data: CardapioData, mode: "dia" | "semana"): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const dias =
    mode === "dia"
      ? [getTodayKey()].filter((d) => data.cardapio[d])
      : ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"].filter(
          (d) => data.cardapio[d]
        );

  if (dias.length === 0) {
    const first = Object.keys(data.cardapio)[0];
    if (first) dias.push(first);
  }

  drawHeader(doc, pageWidth);
  let y = 30;

  for (const dia of dias) {
    y = renderDia(doc, dia, data.cardapio[dia], y, pageWidth, pageHeight);
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) drawHeader(doc, pageWidth);
    drawFooter(doc, pageWidth, pageHeight, i);
  }

  return doc;
}

export function exportCardapioPDF(data: CardapioData, mode: "dia" | "semana") {
  const doc = buildCardapioPDF(data, mode);
  const suffix = mode === "dia" ? "dia" : "semanal";
  doc.save(`coma-facil-cardapio-${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function getCardapioPDFPreviewUrl(data: CardapioData, mode: "dia" | "semana"): string {
  const doc = buildCardapioPDF(data, mode);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

