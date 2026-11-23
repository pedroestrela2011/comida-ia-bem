import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcIMC, HealthProfile } from "@/lib/health";
import { calculateAge } from "@/lib/account-age";

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
  const [hasConsent, setHasConsent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setProfile(null);
    setHasConsent(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Read only the birth date first. Sensitive profile columns are fetched
      // only after age and the matching authorization have both been validated.
      const { data: identity, error: identityError } = await supabase
        .from("profiles")
        .select("data_nascimento")
        .eq("user_id", user.id)
        .maybeSingle();
      if (identityError || !identity) return;

      const age = calculateAge(String(identity.data_nascimento || ""));
      if (age === null) return;
      const expectedAuthorization = age < 18 ? "guardian" : "self";
      const consentQuery = (supabase as any)
        .from("health_data_consents")
        .select("id")
        .eq("user_id", user.id)
        .eq("authorization_type", expectedAuthorization)
        .is("revoked_at", null);

      const { data: consent, error: consentError } = await consentQuery.limit(1).maybeSingle();
      const authorized = !consentError && !!consent;
      setHasConsent(authorized);

      if (!authorized) return;

      const { data: healthData, error: healthError } = await supabase
        .from("profiles")
        .select(HEALTH_FIELDS.join(","))
        .eq("user_id", user.id)
        .maybeSingle();
      if (healthError || !healthData) return;

      // Only authorized, age-appropriate health fields reach feature consumers.
      setProfile(healthData as any);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(
    async (patch: Partial<HealthProfile>, consentConfirmed = false) => {
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
      const { error } = await (supabase as any).rpc("save_health_profile_with_consent", {
        p_profile_data: next,
        p_policy_version: "2026-11-19",
        p_consent_text: "Autorizo o uso dos dados de saúde e alimentação fornecidos para personalizar recursos solicitados por mim.",
        p_confirm_consent: !hasConsent && consentConfirmed,
      });
      if (error) throw error;
      await load();
    },
    [load, profile, hasConsent],
  );

  const revokeConsent = useCallback(async () => {
    const { error } = await (supabase as any).rpc("revoke_health_data_consent");
    if (error) throw error;
    await load();
  }, [load]);

  return { profile, loading, reload: load, update, hasConsent, revokeConsent };
}
