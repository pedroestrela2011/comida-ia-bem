import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  if (today.getUTCMonth() < date.getUTCMonth() ||
      (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())) age--;
  return age;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("APP_URL");
    if (!supabaseUrl || !serviceRoleKey || !appUrl) {
      return json({ error: "Solicitação de responsável temporariamente indisponível" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    const user = authData.user;
    if (authError || !user) return json({ error: "Não autenticado" }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("data_nascimento")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !profile?.data_nascimento) return json({ error: "Não foi possível validar a idade da conta" }, 403);

    const age = getAge(profile.data_nascimento);
    if (age === null || age < 12 || age >= 18) {
      return json({ error: "Esta solicitação está disponível apenas para contas de 12 a 17 anos" }, 403);
    }

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("guardian_checkout_requests").insert({
      beneficiary_user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: "pending",
    });
    if (insertError) {
      console.error("Guardian request creation failed:", insertError.message);
      return json({ error: "Não foi possível criar o link" }, 500);
    }

    let origin: string;
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error("invalid protocol");
      origin = parsed.origin;
    } catch {
      return json({ error: "APP_URL não está configurada corretamente" }, 503);
    }

    return json({
      url: `${origin}/responsavel/contratar?token=${token}`,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("Guardian request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível gerar o link do responsável" }, 500);
  }
});
