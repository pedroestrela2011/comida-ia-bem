import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan, PlanType } from "@/hooks/useUserPlan";

const LIMITS: Record<PlanType, number> = {
  essencial: 3,
  equilibrio: 10,
  performance: 30,
};

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function usePdfLimit() {
  const { plan, isAdmin, isTrial } = useUserPlan();
  const [used, setUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Trial users get only 1 PDF for the entire trial period.
  const limit = isAdmin ? Infinity : isTrial ? 1 : LIMITS[plan];
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const canDownload = remaining > 0;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUsed(0); return; }
      let query = supabase
        .from("pdf_downloads" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!isTrial) {
        query = query.gte("created_at", startOfMonthISO());
      }
      const { count } = await query;
      setUsed(count || 0);
    } catch (e) {
      console.error("pdf limit refresh", e);
    } finally {
      setLoading(false);
    }
  }, [isTrial]);

  useEffect(() => { refresh(); }, [refresh]);

  const registerDownload = useCallback(async (tipo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("pdf_downloads" as any).insert({ user_id: user.id, tipo });
      setUsed(u => u + 1);
    } catch (e) {
      console.error("register pdf", e);
    }
  }, []);

  return {
    used,
    limit,
    remaining,
    canDownload,
    loading,
    plan,
    isAdmin,
    refresh,
    registerDownload,
    isUnlimited: limit === Infinity,
  };
}
