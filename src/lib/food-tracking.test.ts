import { describe, it, expect } from "vitest";
import { calcWeek, summaryAvailable, weekStartOf } from "./food-tracking";

const meal = { nome: "x" };
const day = { cafe_da_manha: meal, lanche_manha: meal, almoco: meal, lanche_tarde: meal, jantar: meal };
const snap = { cardapio: { segunda: day, terca: day, quarta: day, quinta: day, sexta: day, sabado: day, domingo: day } };
const W = "2026-10-26"; // segunda

describe("acompanhamento alimentar", () => {
  it("semana começa na segunda", () => {
    expect(weekStartOf("2026-11-01")).toBe(W); // domingo
    expect(weekStartOf("2026-10-26")).toBe(W);
  });

  it("nota 60% cumpridas + 40% dias registrados", () => {
    const all = Object.fromEntries(Object.keys(day).map((k) => [k, { status: "cumprida" as const }]));
    const days = Array.from({ length: 7 }, (_, i) => ({ day_date: `2026-10-${26 + i <= 31 ? 26 + i : 0}`, meals: all, finalized: true }));
    days[6].day_date = "2026-11-01";
    expect(calcWeek(snap, W, days).nota).toBe(100);
    // só segunda, tudo cumprido: 60*5/35 + 40*1/7 = 8.57+5.71 = 14
    expect(calcWeek(snap, W, [days[0]]).nota).toBe(14);
  });

  it("substituição conta como dia registrado, mas não como cumprida", () => {
    const r = calcWeek(snap, W, [{ day_date: W, meals: { almoco: { status: "substituida", descricao: "pizza" } }, finalized: false }]);
    expect(r.cumpridas).toBe(0);
    expect(r.substituidas).toBe(1);
    expect(r.nota).toBe(6); // 40/7
  });

  it("resumo só após a semana ou domingo finalizado", () => {
    expect(summaryAvailable(W, "2026-10-30", [])).toBe(false);
    expect(summaryAvailable(W, "2026-11-01", [{ day_date: "2026-11-01", meals: {}, finalized: true }])).toBe(true);
    expect(summaryAvailable(W, "2026-11-02", [])).toBe(true);
  });
});
