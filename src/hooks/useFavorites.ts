import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type FavoriteOrigem = "receitas" | "cardapio" | "analisador_prato";

export type FavoriteRecipeData = {
  nome: string;
  descricao?: string;
  tempo_preparo?: string;
  porcoes?: string;
  dificuldade?: string;
  ingredientes?: string[];
  modo_preparo?: string[] | string;
  dicas?: string;
  foto?: string;
  informacoes_nutricionais?: {
    calorias?: string;
    proteinas?: string;
    carboidratos?: string;
    gorduras?: string;
    fibras?: string;
  };
};

export type FavoriteRecord = {
  id: string;
  user_id: string;
  nome: string;
  origem: FavoriteOrigem;
  dados: FavoriteRecipeData;
  created_at: string;
};

export const FAVORITES_LIMIT = 10;

let cache: { items: FavoriteRecord[]; loaded: boolean } = { items: [], loaded: false };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useFavorites() {
  const [items, setItems] = useState<FavoriteRecord[]>(cache.items);
  const [loading, setLoading] = useState(!cache.loaded);

  useEffect(() => {
    const l = () => setItems([...cache.items]);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("favorite_recipes" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      cache.items = (data || []) as unknown as FavoriteRecord[];
      cache.loaded = true;
      notify();
    } catch (e) {
      console.error("fetch favorites", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cache.loaded) fetchAll();
  }, [fetchAll]);

  const isFavorite = useCallback(
    (nome: string) => cache.items.some((f) => f.nome.trim().toLowerCase() === nome.trim().toLowerCase()),
    [items],
  );

  const findByName = useCallback(
    (nome: string) => cache.items.find((f) => f.nome.trim().toLowerCase() === nome.trim().toLowerCase()),
    [items],
  );

  const add = useCallback(async (dados: FavoriteRecipeData, origem: FavoriteOrigem) => {
    if (!dados?.nome) return false;
    if (cache.items.length >= FAVORITES_LIMIT) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${FAVORITES_LIMIT} receitas favoritas. Remova uma receita para adicionar outra.`,
        variant: "destructive",
      });
      return false;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Faça login para favoritar.", variant: "destructive" }); return false; }
      const { data, error } = await supabase
        .from("favorite_recipes" as any)
        .insert({ user_id: user.id, nome: dados.nome, origem, dados: dados as any })
        .select("*")
        .single();
      if (error) throw error;
      cache.items = [data as unknown as FavoriteRecord, ...cache.items];
      notify();
      toast({ title: "Receita adicionada aos favoritos." });
      return true;
    } catch (e: any) {
      toast({ title: "Erro ao favoritar", description: e.message, variant: "destructive" });
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("favorite_recipes" as any).delete().eq("id", id);
      if (error) throw error;
      cache.items = cache.items.filter((f) => f.id !== id);
      notify();
      toast({ title: "Receita removida dos favoritos." });
      return true;
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
      return false;
    }
  }, []);

  const toggle = useCallback(async (dados: FavoriteRecipeData, origem: FavoriteOrigem) => {
    const existing = findByName(dados.nome);
    if (existing) return remove(existing.id);
    return add(dados, origem);
  }, [add, remove, findByName]);

  return { items, loading, isFavorite, findByName, add, remove, toggle, refetch: fetchAll, limit: FAVORITES_LIMIT };
}
