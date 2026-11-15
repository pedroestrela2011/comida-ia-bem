import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MENU_MONTHLY_LIMIT, monthStartSaoPaulo, remainingCreations } from "@/lib/menu-limit";

export function useMenuCreations() {
  const [used, setUsed] = useState(0);
  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase.from("menu_creations").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", monthStartSaoPaulo());
    setUsed(count ?? 0);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { used, limit: MENU_MONTHLY_LIMIT, remaining: remainingCreations(used), refresh };
}
