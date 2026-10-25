import { describe, expect, it } from "vitest";
import { adaptedShoppingRows, buildAdaptedShoppingPDF } from "./adapted-shopping-pdf";

describe("adapted shopping export", () => {
  it("preserves checked weekly and stock items without excluding unmarked items", () => {
    const rows = adaptedShoppingRows({ semanal: { proteinas: ["200g de frango", "2 ovos"] }, mensal_estoque: ["1 kg de arroz"] }, { "proteinas::200g de frango": true, "estoque::1 kg de arroz": true }, 1);
    expect(rows.map((row) => row.checked)).toEqual([true, false, true]);
    expect(rows.map((row) => row.quantity)).toEqual(["200g", "2 ovos", "1 kg"]);
  });
  it("scales quantities for the selected portions and preserves ingredients without numbers", () => {
    const rows = adaptedShoppingRows({ semanal: { outros: ["0,5 xícara de aveia", "sal a gosto", "alface"] } }, {}, 3);
    expect(rows.map((row) => row.item)).toEqual(["1,5 xícara de aveia", "sal a gosto", "alface"]);
    expect(rows.map((row) => row.quantity)).toEqual(["1,5 xícara", "A gosto", "Não informada"]);
  });
  it("creates a nonempty PDF", () => {
    const doc = buildAdaptedShoppingPDF({ semanal: { outros: ["1 kg de arroz"] } }, {}, 2, {});
    expect(doc.output().startsWith("%PDF-")).toBe(true);
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1000);
  });
});