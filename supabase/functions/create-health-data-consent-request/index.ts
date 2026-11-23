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
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), appUrl = Deno.env.get("APP_URL");
    if (!url || !key || !appUrl) return json({ error: "Serviço temporariamente indisponível" }, 503);
    const bearer = req.headers.get("Authorization");
    if (!bearer?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(bearer.slice(7));
    if (authError || !auth.user) return json({ error: "Não autenticado" }, 401);
    const { data: profile, error } = await admin.from("profiles").select("data_nascimento").eq("user_id", auth.user.id).maybeSingle();
    if (error || !profile?.data_nascimento) return json({ error: "Não foi possível validar a idade da conta" }, 403);
    const age = ageOf(profile.data_nascimento);
    if (age === null || age < 12 || age >= 18) return json({ error: "Este fluxo está disponível apenas para contas de 12 a 17 anos" }, 403);

    const { count, error: countError } = await admin.from("health_data_consent_requests")
      .select("id", { count: "exact", head: true })
      .eq("beneficiary_user_id", auth.user.id)
      .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if (countError) return json({ error: "Não foi possível criar a solicitação" }, 503);
    if ((count ?? 0) >= 5) return json({ error: "Limite de solicitações atingido. Tente novamente em uma hora." }, 429);

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("health_data_consent_requests").insert({
      beneficiary_user_id: auth.user.id, token_hash: await hash(token), expires_at: expiresAt,
    });
    if (insertError) return json({ error: "Não foi possível criar o link de autorização" }, 500);

    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return json({ error: "APP_URL deve usar HTTPS" }, 503);
    return json({ url: parsed.origin + "/responsavel/autorizar-saude?token=" + token, expires_at: expiresAt });
  } catch (error) {
    console.error("Health consent request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível gerar o link de autorização" }, 500);
  }
});
