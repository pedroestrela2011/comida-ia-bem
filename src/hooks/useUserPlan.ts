import { useEffect, useState } from "react";
import { useSubscription, PlanType } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

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

const allFeatures: FeatureAccess = {
  cardapio: true,
  receitas: true,
  chat: true,
  modoEsporte: true,
  progresso: true,
  analisadorPrato: true,
  scoreDiario: true,
  conquistas: true,
};

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
  performance: allFeatures,
};

// Module-level cache to avoid flicker when navigating
let adminCache: boolean | null = null;

export function useUserPlan() {
  const { plan, loading } = useSubscription();
  const [isAdmin, setIsAdmin] = useState<boolean>(adminCache ?? false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          adminCache = false;
          setIsAdmin(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        const value = Boolean(data);
        adminCache = value;
        setIsAdmin(value);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    plan,
    loading,
    isAdmin,
    features: isAdmin ? allFeatures : planFeatures[plan],
    planLabel: isAdmin
      ? "Administrador"
      : plan === "essencial" ? "Essencial" : plan === "equilibrio" ? "Equilíbrio" : "Performance",
  };
}

export type { PlanType };
