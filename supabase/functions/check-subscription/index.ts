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
    if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
      return json({ error: "Subscription service unavailable" }, 503);
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
      .select("data_nascimento, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !profile?.data_nascimento) {
      return json({ error: "Profile age could not be validated" }, 403);
    }

    const age = getAge(profile.data_nascimento);
    if (age === null || age < 12) return json({ error: "Account age is invalid" }, 403);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // A teen remains on the permanent free tier unless an adult has completed
    // a one-time guardian checkout tied to this exact beneficiary account.
    if (age < 18) {
      const { data: guardianRequests } = await supabase
        .from("guardian_checkout_requests")
        .select("id, stripe_customer_id")
        .eq("beneficiary_user_id", user.id)
        .eq("status", "checkout_created")
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      for (const guardianRequest of guardianRequests ?? []) {
        const guardianSubscriptions = await stripe.subscriptions.list({
          customer: guardianRequest.stripe_customer_id,
          status: "all",
          limit: 10,
        });
        const linkedSubscription = guardianSubscriptions.data.find((item) =>
          (item.status === "active" || item.status === "trialing") &&
          item.metadata?.beneficiary_user_id === user.id &&
          item.metadata?.guardian_request_id === guardianRequest.id
        );
        if (!linkedSubscription) continue;

        const productId = linkedSubscription.items.data[0]?.price.product;
        const guardianPlanMap: Record<string, string> = {
          "prod_UH384VjqiDfjkk": "essencial",
          "prod_UH38eWsa8YkfG9": "equilibrio",
          "prod_UH39mhR0txjsdp": "performance",
        };
        const plan = guardianPlanMap[String(productId)] ?? "essencial";
        const subscriptionEnd = new Date(linkedSubscription.current_period_end * 1000).toISOString();
        await supabase.from("profiles").update({ plano: plan, trial_ends_at: null }).eq("user_id", user.id);
        return json({
          subscribed: true,
          plan,
          product_id: productId,
          subscription_end: subscriptionEnd,
          trial_ends_at: null,
          paid_by_guardian: true,
        });
      }

      await supabase.from("profiles").update({ plano: "essencial", trial_ends_at: null }).eq("user_id", user.id);
      return json({ subscribed: false, plan: "essencial", trial_ends_at: null, subscription_end: null });
    }
    const customers = await stripe.customers.list({ email: user.email, limit: 100 });
    const customer = customers.data.find(
      (candidate) => candidate.metadata?.supabase_user_id === user.id && !candidate.deleted,
    );
    if (!customer) {
      await supabase.from("profiles").update({ plano: "essencial" }).eq("user_id", user.id);
      return json({ subscribed: false, plan: "essencial", trial_ends_at: profile.trial_ends_at ?? null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    });
    const subscription = subscriptions.data.find(
      (item) => item.metadata?.supabase_user_id === user.id,
    );
    if (!subscription) {
      await supabase.from("profiles").update({ plano: "essencial" }).eq("user_id", user.id);
      return json({ subscribed: false, plan: "essencial", trial_ends_at: profile.trial_ends_at ?? null });
    }

    const productId = subscription.items.data[0]?.price.product;
    const productPlanMap: Record<string, string> = {
      "prod_UH384VjqiDfjkk": "essencial",
      "prod_UH38eWsa8YkfG9": "equilibrio",
      "prod_UH39mhR0txjsdp": "performance",
    };
    const plan = productPlanMap[String(productId)] ?? "essencial";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase.from("profiles").update({ plano: plan }).eq("user_id", user.id);
    return json({
      subscribed: true,
      plan,
      product_id: productId,
      subscription_end: subscriptionEnd,
      trial_ends_at: profile.trial_ends_at ?? null,
    });
  } catch (error) {
    console.error("Subscription check failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not check subscription" }, 500);
  }
});
