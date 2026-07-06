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

// During the 7-day free trial, only the cardápio is unlocked.
const trialFeatures: FeatureAccess = {
  cardapio: true,
  receitas: false,
  chat: false,
  modoEsporte: false,
  progresso: false,
  analisadorPrato: false,
  scoreDiario: false,
  conquistas: false,
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
  const { plan, loading, subscribed, trialEndsAt, trialExpired } = useSubscription();
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

  const isTrial =
    !isAdmin &&
    !subscribed &&
    plan === "essencial" &&
    !!trialEndsAt &&
    !trialExpired;

  const features = isAdmin
    ? allFeatures
    : isTrial
      ? trialFeatures
      : planFeatures[plan];

  return {
    plan,
    loading,
    isAdmin,
    isTrial,
    features,
    planLabel: isAdmin
      ? "Administrador"
      : isTrial
        ? "Teste grátis"
        : plan === "essencial" ? "Essencial" : plan === "equilibrio" ? "Equilíbrio" : "Performance",
  };
}

export type { PlanType };
