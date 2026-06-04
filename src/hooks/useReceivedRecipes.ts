import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FavoriteRecipeData } from "@/hooks/useFavorites";

export type ReceivedRecipe = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_email: string | null;
  sender_name: string | null;
  nome: string;
  dados: FavoriteRecipeData;
  read: boolean;
  created_at: string;
};

export function useReceivedRecipes() {
  const [items, setItems] = useState<ReceivedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); return; }
      const { data, error } = await supabase
        .from("shared_recipes" as any)
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data || []) as unknown as ReceivedRecipe[]);
    } catch (e) {
      console.error("fetch received recipes", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from("shared_recipes" as any).update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from("shared_recipes" as any).delete().eq("id", id);
    setItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  return { items, loading, refetch: fetchAll, markRead, remove, unreadCount };
}
