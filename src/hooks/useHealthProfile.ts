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

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(HEALTH_FIELDS.join(","))
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError || !data) return;

      const age = calculateAge(String((data as any).data_nascimento || ""));
      const expectedAuthorization = age !== null && age < 18 ? "guardian" : "self";
      let consentQuery = (supabase as any)
        .from("health_data_consents")
        .select("id")
        .eq("user_id", user.id)
        .eq("authorization_type", expectedAuthorization)
        .is("revoked_at", null);

      if (expectedAuthorization === "guardian") {
        consentQuery = consentQuery.not("guardian_user_id", "is", null);
      }

      const { data: consent, error: consentError } = await consentQuery.limit(1).maybeSingle();
      const authorized = !consentError && !!consent;
      setHasConsent(authorized);

      // Never expose previously stored sensitive profile fields to feature consumers
      // when the account has no currently valid authorization.
      if (authorized) setProfile(data as any);
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
