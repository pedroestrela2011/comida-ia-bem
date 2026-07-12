import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcIMC, HealthProfile } from "@/lib/health";

const HEALTH_FIELDS = [
  "peso_kg",
  "altura_cm",
  "imc",
  "objetivo",
  "nivel_atividade",
  "refeicoes_dia",
  "restricoes_alimentares",
  "alergias",
  "condicoes_saude",
  "condicoes_outras",
  "unidade_peso",
  "unidade_altura",
  "idioma",
  "onboarding_completo",
  "data_nascimento",
  "pais",
] as const;

export function useHealthProfile() {
  const [profile, setProfile] = useState<(HealthProfile & { data_nascimento?: string | null; pais?: string | null }) | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(HEALTH_FIELDS.join(","))
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile((data as any) || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(
    async (patch: Partial<HealthProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const next: any = { ...patch };
      if (next.peso_kg != null && next.altura_cm != null) {
        next.imc = calcIMC(Number(next.peso_kg), Number(next.altura_cm));
      } else if (next.peso_kg != null || next.altura_cm != null) {
        const peso = next.peso_kg ?? profile?.peso_kg;
        const altura = next.altura_cm ?? profile?.altura_cm;
        if (peso && altura) next.imc = calcIMC(Number(peso), Number(altura));
      }
      const { error } = await supabase
        .from("profiles")
        .update(next)
        .eq("user_id", user.id);
      if (error) throw error;
      await load();
    },
    [load, profile],
  );

  return { profile, loading, reload: load, update };
}
