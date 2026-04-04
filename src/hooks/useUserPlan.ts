import { useSubscription, PlanType } from "@/contexts/SubscriptionContext";

interface FeatureAccess {
  cardapio: boolean;
  receitas: boolean;
  chat: boolean;
  modoEsporte: boolean;
  progresso: boolean;
  analisadorPrato: boolean;
  scoreDiario: boolean;
  conquistas: boolean;
}

const planFeatures: Record<PlanType, FeatureAccess> = {
  essencial: {
    cardapio: true,
    receitas: true,
    chat: true,
    modoEsporte: false,
    progresso: false,
    analisadorPrato: false,
    scoreDiario: false,
    conquistas: false,
  },
  equilibrio: {
    cardapio: true,
    receitas: true,
    chat: true,
    modoEsporte: true,
    progresso: true,
    analisadorPrato: true,
    scoreDiario: false,
    conquistas: false,
  },
  performance: {
    cardapio: true,
    receitas: true,
    chat: true,
    modoEsporte: true,
    progresso: true,
    analisadorPrato: true,
    scoreDiario: true,
    conquistas: true,
  },
};

export function useUserPlan() {
  const { plan, loading } = useSubscription();

  return {
    plan,
    loading,
    features: planFeatures[plan],
    planLabel: plan === "essencial" ? "Essencial" : plan === "equilibrio" ? "Equilíbrio" : "Performance",
  };
}

export type { PlanType };
