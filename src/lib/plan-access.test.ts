import { describe, expect, it } from "vitest";
import { hasPaidPlanAccess } from "../../supabase/functions/_shared/plan-access";

const access = (plan: string, subscriptionActive = true) => ({
  plan,
  subscriptionActive,
  isAdmin: false,
});

describe("acesso pago no servidor", () => {
  it("permite o Analisador para assinatura Essencial ativa e bloqueia o trial", () => {
    expect(hasPaidPlanAccess(access("essencial"), "essencial")).toBe(true);
    expect(hasPaidPlanAccess(access("essencial", false), "essencial")).toBe(false);
  });

  it("permite Modo Esporte e Adaptador a partir do Equilíbrio", () => {
    expect(hasPaidPlanAccess(access("essencial"), "equilibrio")).toBe(false);
    expect(hasPaidPlanAccess(access("equilibrio"), "equilibrio")).toBe(true);
    expect(hasPaidPlanAccess(access("performance"), "equilibrio")).toBe(true);
  });

  it("limita gamificação e Assistente Premium ao Performance", () => {
    expect(hasPaidPlanAccess(access("equilibrio"), "performance")).toBe(false);
    expect(hasPaidPlanAccess(access("performance"), "performance")).toBe(true);
  });

  it("preserva o acesso de administradores sem assinatura", () => {
    expect(hasPaidPlanAccess({ plan: "essencial", subscriptionActive: false, isAdmin: true }, "performance")).toBe(true);
  });
});
