import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "essencial" | "equilibrio" | "performance";

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
    chat: true, // limited but accessible
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
  const [plan, setPlan] = useState<PlanType>("essencial");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("user_id", user.id)
        .single();

      if (data?.plano) {
        setPlan(data.plano as PlanType);
      }
      setLoading(false);
    };

    fetchPlan();
  }, []);

  return {
    plan,
    loading,
    features: planFeatures[plan],
    planLabel: plan === "essencial" ? "Essencial" : plan === "equilibrio" ? "Equilíbrio" : "Performance",
  };
}
