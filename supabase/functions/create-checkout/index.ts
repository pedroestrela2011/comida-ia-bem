import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_PRICES = new Set([
  "price_1TIV2IJlzscuia2SQCTSFa5u",
  "price_1TIV2ZJlzscuia2SjJfXkJHU",
  "price_1TIV2sJlzscuia2SsODpd2HD",
]);

function getAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const birthdayPending =
    today.getUTCMonth() < date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate());
  if (birthdayPending) age--;
  return age;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeKey || !appUrl) {
      console.error("Missing checkout environment configuration");
      return json({ error: "Checkout temporariamente indisponível" }, 503);
    }

    const token = authHeader.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user?.email) return json({ error: "Não autenticado" }, 401);
    const user = authData.user;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("data_nascimento")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.data_nascimento) {
      console.error("Checkout blocked: profile birth date unavailable", profileError?.message);
      return json({ error: "Não foi possível validar a idade desta conta" }, 403);
    }

    const age = getAge(profile.data_nascimento);
    if (age === null || age < 18) {
      return json({ error: "A contratação de planos pagos deve ser realizada por um responsável adulto" }, 403);
    }

    const body = await req.json().catch(() => null);
    const priceId = body?.priceId;
    if (typeof priceId !== "string" || !ALLOWED_PRICES.has(priceId)) {
      return json({ error: "Plano ou preço inválido" }, 400);
    }

    let siteOrigin: string;
    try {
      const configuredUrl = new URL(appUrl);
      if (configuredUrl.protocol !== "https:" && configuredUrl.hostname !== "localhost") {
        return json({ error: "APP_URL deve usar HTTPS" }, 503);
      }
      siteOrigin = configuredUrl.origin;
    } catch {
      return json({ error: "APP_URL não está configurada corretamente" }, 503);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 100 });
    let customer = existingCustomers.data.find(
      (candidate) => candidate.metadata?.supabase_user_id === user.id && !candidate.deleted,
    );

    // Never attach a subscription to a different account merely because its
    // Stripe customer happens to share the same email address.
    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        name: typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome : undefined,
        metadata: { supabase_user_id: user.id },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${siteOrigin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/dashboard/configuracoes?checkout=cancel`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("Checkout creation failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível iniciar o checkout" }, 500);
  }
});
