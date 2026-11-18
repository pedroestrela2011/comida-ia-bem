import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  if (
    today.getUTCMonth() < date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())
  ) age--;
  return age;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL");
    if (!supabaseUrl || !serviceRoleKey || !stripeKey || !appUrl) {
      return json({ error: "Billing portal unavailable" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    const user = authData.user;
    if (authError || !user?.email) return json({ error: "Unauthorized" }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("data_nascimento")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !profile?.data_nascimento) return json({ error: "Profile age could not be validated" }, 403);

    const age = getAge(profile.data_nascimento);
    if (age === null || age < 18) {
      return json({ error: "A área de cobrança está disponível somente para titulares adultos" }, 403);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 100 });
    const customer = customers.data.find(
      (candidate) => candidate.metadata?.supabase_user_id === user.id && !candidate.deleted,
    );
    if (!customer) return json({ error: "Nenhum cadastro de cobrança vinculado a esta conta" }, 404);

    const returnOrigin = appUrl;
    let safeOrigin: string;
    try {
      const parsed = new URL(returnOrigin);
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return json({ error: "URL de retorno inválida" }, 400);
      safeOrigin = parsed.origin;
    } catch {
      return json({ error: "URL de retorno inválida" }, 400);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${safeOrigin}/dashboard/configuracoes`,
    });
    return json({ url: portalSession.url });
  } catch (error) {
    console.error("Customer portal creation failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível abrir o portal de cobrança" }, 500);
  }
});
