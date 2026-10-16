// Scales the first numeric quantity in an ingredient line (e.g. "1/2 xícara", "1 1/2 colher", "200g", "1,5 kg").
// Lines without a number ("sal a gosto") are returned unchanged.
const QTY = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/;

function parseQty(raw: string): number {
  const t = raw.trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(t.replace(",", "."));
}

export function friendlyNumber(n: number): string {
  let r: number;
  if (n >= 100) r = Math.round(n / 5) * 5;
  else if (n >= 10) r = Math.round(n);
  else r = Math.max(0.25, Math.round(n * 4) / 4);
  return r.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function scaleIngredient(line: string, factor: number): string {
  if (factor === 1) return line;
  const m = line.match(QTY);
  if (!m || m.index === undefined) return line;
  const value = parseQty(m[1]);
  if (!isFinite(value) || value <= 0) return line;
  return line.slice(0, m.index) + friendlyNumber(value * factor) + line.slice(m.index + m[1].length);
}

export function parseServings(v: unknown): number {
  const m = String(v ?? "").match(/\d+/);
  const n = m ? Number(m[0]) : 1;
  return n > 0 ? n : 1;
}
