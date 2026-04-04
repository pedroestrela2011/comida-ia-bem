import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "essencial" | "equilibrio" | "performance";

interface SubscriptionState {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  plan: "essencial",
  subscribed: false,
  subscriptionEnd: null,
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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanType>("essencial");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setPlan(data.plan || "essencial");
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (e) {
      console.error("Error checking subscription:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check on mount
    refreshSubscription();

    // Check every 60 seconds
    const interval = setInterval(refreshSubscription, 60000);

    // Check on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refreshSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [refreshSubscription]);

  return (
    <SubscriptionContext.Provider value={{ plan, subscribed, subscriptionEnd, loading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
