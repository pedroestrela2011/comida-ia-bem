import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearLocalAuthSession, isStaleAuthSessionError } from "@/lib/auth-session";

export type PlanType = "essencial" | "equilibrio" | "performance";

interface SubscriptionState {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  daysLeftInTrial: number | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  plan: "essencial",
  subscribed: false,
  subscriptionEnd: null,
  trialEndsAt: null,
  trialExpired: false,
  daysLeftInTrial: null,
  loading: true,
  refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

// Stripe product/price mapping
export const PLAN_CONFIG = {
  essencial: {
    product_id: "prod_UH384VjqiDfjkk",
    price_id: "price_1TIV2IJlzscuia2SQCTSFa5u",
    label: "Essencial",
    price: "19,90",
  },
  equilibrio: {
    product_id: "prod_UH38eWsa8YkfG9",
    price_id: "price_1TIV2ZJlzscuia2SjJfXkJHU",
    label: "Equilíbrio",
    price: "27,90",
  },
  performance: {
    product_id: "prod_UH39mhR0txjsdp",
    price_id: "price_1TIV2sJlzscuia2SsODpd2HD",
    label: "Performance",
    price: "35,90",
  },
} as const;

// Module-level cache so remounting the provider (e.g. navigating back to
// the dashboard) doesn't re-trigger the full-screen "Carregando..." gate.
const cache: {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
  loaded: boolean;
} = {
  plan: "essencial",
  subscribed: false,
  subscriptionEnd: null,
  trialEndsAt: null,
  loaded: false,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanType>(cache.plan);
  const [subscribed, setSubscribed] = useState(cache.subscribed);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(cache.subscriptionEnd);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(cache.trialEndsAt);
  const [loading, setLoading] = useState(!cache.loaded);

  const refreshSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPlan("essencial");
        setSubscribed(false);
        setSubscriptionEnd(null);
        setTrialEndsAt(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        if (isStaleAuthSessionError(error)) {
          await clearLocalAuthSession();
          return;
        }
        throw error;
      }
      if (data?.user_missing) {
        await clearLocalAuthSession();
        return;
      }
      const nextPlan: PlanType = data.plan || "essencial";
      const nextSubscribed = data.subscribed || false;
      const nextSubEnd = data.subscription_end || null;
      const nextTrial = data.trial_ends_at || null;
      cache.plan = nextPlan;
      cache.subscribed = nextSubscribed;
      cache.subscriptionEnd = nextSubEnd;
      cache.trialEndsAt = nextTrial;
      setPlan(nextPlan);
      setSubscribed(nextSubscribed);
      setSubscriptionEnd(nextSubEnd);
      setTrialEndsAt(nextTrial);
    } catch (e) {
      if (isStaleAuthSessionError(e)) {
        await clearLocalAuthSession();
        return;
      }
      console.error("Error checking subscription:", e);
    } finally {
      cache.loaded = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSubscription();
    const interval = setInterval(refreshSubscription, 60000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refreshSubscription();
    });
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [refreshSubscription]);

  const now = Date.now();
  const trialMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null;
  const trialExpired =
    !subscribed && plan === "essencial" && trialMs !== null && now > trialMs;
  const daysLeftInTrial =
    !subscribed && plan === "essencial" && trialMs !== null
      ? Math.max(0, Math.ceil((trialMs - now) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        subscribed,
        subscriptionEnd,
        trialEndsAt,
        trialExpired,
        daysLeftInTrial,
        loading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
