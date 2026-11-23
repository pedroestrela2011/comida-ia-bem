import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
function ageOf(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Serviço temporariamente indisponível" }, 503);
    const bearer = req.headers.get("Authorization");
    if (!bearer?.startsWith("Bearer ")) return json({ error: "É necessário entrar em uma conta adulta" }, 401);
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(bearer.slice(7));
    const guardian = auth.user;
    if (authError || !guardian || !guardian.email || !guardian.email_confirmed_at) {
      return json({ error: "Entre em uma conta com e-mail confirmado" }, 401);
    }

    const { data: guardianProfile, error: guardianProfileError } = await admin.from("profiles")
      .select("data_nascimento").eq("user_id", guardian.id).maybeSingle();
    const guardianAge = guardianProfile?.data_nascimento ? ageOf(guardianProfile.data_nascimento) : null;
    if (guardianProfileError || guardianAge === null || guardianAge < 18) {
      return json({ error: "A autorização exige uma conta com 18 anos completos ou mais e data de nascimento cadastrada" }, 403);
    }

    const body = await req.json().catch(() => null);
    const token = body?.token;
    const name = typeof body?.guardianName === "string" ? body.guardianName.trim() : "";
    const relationship = body?.relationship;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return json({ error: "Link inválido ou expirado" }, 400);
    if (name.length < 3 || name.length > 120) return json({ error: "Informe seu nome completo" }, 400);
    if (!["pai", "mae", "tutor_legal"].includes(relationship)) return json({ error: "Selecione o vínculo legal correspondente" }, 400);
    if (body?.confirmLegalAuthority !== true || body?.confirmHealthConsent !== true) {
      return json({ error: "As duas confirmações são obrigatórias" }, 400);
    }

    const { data: request, error: requestError } = await admin.from("health_data_consent_requests")
      .select("id, beneficiary_user_id, expires_at, status")
      .eq("token_hash", await hash(token)).maybeSingle();
    if (requestError || !request || request.status !== "pending" || new Date(request.expires_at).getTime() <= Date.now()) {
      return json({ error: "Link inválido, expirado ou já utilizado. Peça uma nova autorização." }, 410);
    }

    const { data: beneficiary, error: beneficiaryError } = await admin.from("profiles")
      .select("data_nascimento").eq("user_id", request.beneficiary_user_id).maybeSingle();
    const beneficiaryAge = beneficiary?.data_nascimento ? ageOf(beneficiary.data_nascimento) : null;
    if (beneficiaryError || beneficiaryAge === null || beneficiaryAge < 12 || beneficiaryAge >= 18) {
      return json({ error: "A conta vinculada não atende aos critérios de idade" }, 403);
    }
    if (guardian.id === request.beneficiary_user_id) return json({ error: "A conta do adolescente não pode autorizar a si mesma" }, 403);

    const { data: claimed, error: claimError } = await admin.from("health_data_consent_requests")
      .update({
        status: "accepted", guardian_user_id: guardian.id,
        guardian_name: name, guardian_email: guardian.email.toLowerCase(),
        guardian_relationship: relationship, accepted_at: new Date().toISOString(),
      })
      .eq("id", request.id).eq("status", "pending")
      .gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
    if (claimError || !claimed) return json({ error: "Este link já foi utilizado. Gere uma nova solicitação." }, 409);

    const consentText = "Autorizo, na qualidade de pai, mãe ou tutor legal declarado, o tratamento dos dados de saúde e alimentação do adolescente vinculado para personalização dos recursos solicitados na plataforma. Declaro ter autoridade legal para conceder esta autorização e estar ciente de que ela pode ser revogada.";
    const { error: consentError } = await admin.from("health_data_consents").insert({
      user_id: request.beneficiary_user_id,
      policy_version: "2026-11-23",
      purpose: "Personalização de cardápios, receitas, alertas alimentares e recursos solicitados pelo adolescente, mediante autorização declarada de responsável",
      consent_text: consentText,
      authorization_type: "guardian",
      guardian_user_id: guardian.id,
      guardian_name: name,
      guardian_email: guardian.email.toLowerCase(),
      guardian_relationship: relationship,
    });
    if (consentError) {
      await admin.from("health_data_consent_requests").update({ status: "cancelled" }).eq("id", request.id);
      console.error("Guardian consent record failed", consentError.message);
      return json({ error: "Não foi possível registrar a autorização. Gere um novo link e tente novamente." }, 500);
    }
    return json({ success: true, beneficiary_user_id: request.beneficiary_user_id });
  } catch (error) {
    console.error("Health consent acceptance failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível registrar a autorização" }, 500);
  }
});
