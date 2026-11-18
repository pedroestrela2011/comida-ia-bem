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

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let supabase: ReturnType<typeof createClient> | null = null;
  let requestId: string | null = null;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL");
    if (!supabaseUrl || !serviceRoleKey || !stripeKey || !appUrl) {
      return json({ error: "Checkout do responsável temporariamente indisponível" }, 503);
    }

    const body = await req.json().catch(() => null);
    const token = body?.token;
    const guardianName = typeof body?.guardianName === "string" ? body.guardianName.trim() : "";
    const guardianEmail = typeof body?.guardianEmail === "string" ? body.guardianEmail.trim().toLowerCase() : "";
    const priceId = body?.priceId;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return json({ error: "Link inválido ou expirado" }, 400);
    if (guardianName.length < 3 || guardianName.length > 120) return json({ error: "Informe o nome do responsável" }, 400);
    if (!/^\S+@\S+\.\S+$/.test(guardianEmail) || guardianEmail.length > 254) return json({ error: "Email do responsável inválido" }, 400);
    if (body?.responsibleAdultConfirmed !== true) return json({ error: "É necessário confirmar a responsabilidade pela contratação" }, 400);
    if (typeof priceId !== "string" || !ALLOWED_PRICES.has(priceId)) return json({ error: "Plano ou preço inválido" }, 400);

    supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const tokenHash = await sha256(token);
    const { data: requestRow, error: requestError } = await supabase
      .from("guardian_checkout_requests")
      .select("id, beneficiary_user_id, expires_at, status")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (requestError || !requestRow || requestRow.status !== "pending" || new Date(requestRow.expires_at).getTime() <= Date.now()) {
      return json({ error: "Link inválido, já utilizado ou expirado. Peça um novo link ao titular da conta." }, 410);
    }
    requestId = requestRow.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("data_nascimento")
      .eq("user_id", requestRow.beneficiary_user_id)
      .maybeSingle();
    const age = profile?.data_nascimento ? getAge(profile.data_nascimento) : null;
    if (profileError || age === null || age < 12 || age >= 18) return json({ error: "A conta beneficiária não atende aos critérios de idade" }, 403);

    // Atomically consume the one-time token before contacting Stripe.
    const { data: claimed, error: claimError } = await supabase
      .from("guardian_checkout_requests")
      .update({
        status: "checkout_created",
        guardian_name: guardianName,
        guardian_email: guardianEmail,
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (claimError || !claimed) return json({ error: "Este link já foi utilizado. Peça um novo link ao titular da conta." }, 409);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customer = await stripe.customers.create({
      email: guardianEmail,
      name: guardianName,
      metadata: {
        beneficiary_user_id: requestRow.beneficiary_user_id,
        guardian_request_id: requestId,
        contracting_adult_email: guardianEmail,
      },
    });

    const parsedAppUrl = new URL(appUrl);
    if (parsedAppUrl.protocol !== "https:" && parsedAppUrl.hostname !== "localhost") {
      throw new Error("APP_URL must use HTTPS");
    }
    const origin = parsedAppUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: requestRow.beneficiary_user_id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      metadata: {
        beneficiary_user_id: requestRow.beneficiary_user_id,
        guardian_request_id: requestId,
        contracting_adult_name: guardianName,
        contracting_adult_email: guardianEmail,
      },
      subscription_data: {
        metadata: {
          beneficiary_user_id: requestRow.beneficiary_user_id,
          guardian_request_id: requestId,
          contracting_adult_name: guardianName,
          contracting_adult_email: guardianEmail,
        },
      },
      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/responsavel/contratar?token=${token}&cancelled=1`,
    });

    const { error: saveError } = await supabase
      .from("guardian_checkout_requests")
      .update({ stripe_customer_id: customer.id, stripe_checkout_session_id: session.id })
      .eq("id", requestId);
    if (saveError) throw saveError;

    return json({ url: session.url });
  } catch (error) {
    if (supabase && requestId) {
      await supabase.from("guardian_checkout_requests").update({ status: "cancelled" }).eq("id", requestId);
    }
    console.error("Guardian checkout failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Não foi possível iniciar o pagamento" }, 500);
  }
});
