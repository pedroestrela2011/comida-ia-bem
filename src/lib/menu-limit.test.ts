import { describe, it, expect } from "vitest";
import { monthStartSaoPaulo, remainingCreations, mealNames } from "./menu-limit";

describe("limite mensal de cardápios", () => {
  it("permite 4 criações por mês", () => {
    expect(remainingCreations(0)).toBe(4);
    expect(remainingCreations(2)).toBe(2);
    expect(remainingCreations(4)).toBe(0);
    expect(remainingCreations(6)).toBe(0);
  });
  it("mês reinicia no dia 1 no horário de São Paulo", () => {
    // 1º de dez 01:00 UTC ainda é 30 de nov em São Paulo
    expect(monthStartSaoPaulo(new Date("2026-12-01T01:00:00Z"))).toBe("2026-11-01T03:00:00.000Z");
    expect(monthStartSaoPaulo(new Date("2026-12-01T04:00:00Z"))).toBe("2026-12-01T03:00:00.000Z");
  });
  it("lista os pratos do cardápio anterior", () => {
    expect(mealNames({ segunda: { almoco: { nome: "Frango" }, jantar: { nome: "Sopa" } } })).toEqual(["Frango", "Sopa"]);
  });
});
