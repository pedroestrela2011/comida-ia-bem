import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const PLAN_BY_PRODUCT: Record<string, string> = {
  "prod_UH384VjqiDfjkk": "essencial",
  "prod_UH38eWsa8YkfG9": "equilibrio",
  "prod_UH39mhR0txjsdp": "performance",
};

function metadataString(metadata: Stripe.Metadata | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getPlan(subscription: Stripe.Subscription): string | null {
  const product = subscription.items.data[0]?.price.product;
  return PLAN_BY_PRODUCT[String(product)] ?? null;
}

function getUserId(subscription: Stripe.Subscription): string | null {
  return metadataString(subscription.metadata, "supabase_user_id")
    ?? metadataString(subscription.metadata, "beneficiary_user_id");
}

function isEntitled(subscription: Stripe.Subscription): boolean {
  return subscription.status === "active" || subscription.status === "trialing";
}

async function syncSubscription(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  const userId = getUserId(subscription);
  if (!userId) {
    console.warn("Stripe subscription has no linked application user", subscription.id);
    return;
  }

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  const customerIds = new Set<string>([customerId]);

  // A beneficiary may have more than one guardian checkout request. Check all
  // linked customers before removing access after one subscription is canceled.
  const { data: guardianRequests, error: guardianQueryError } = await supabase
    .from("guardian_checkout_requests")
    .select("id, stripe_customer_id")
    .eq("beneficiary_user_id", userId)
    .not("stripe_customer_id", "is", null);
  if (guardianQueryError) throw guardianQueryError;

  for (const request of guardianRequests ?? []) {
    if (request.stripe_customer_id) customerIds.add(request.stripe_customer_id);
  }

  const subscriptionsByCustomer = await Promise.all(
    Array.from(customerIds).map((id) =>
      stripe.subscriptions.list({ customer: id, status: "all", limit: 100 })
    ),
  );

  const currentEntitlement = subscriptionsByCustomer
    .flatMap((result) => result.data)
    .filter((candidate) => {
      if (!isEntitled(candidate) || !getPlan(candidate)) return false;
      const candidateUserId = getUserId(candidate);
      return candidateUserId === userId;
    })
    .sort((a, b) => b.created - a.created)[0];

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plano: currentEntitlement ? getPlan(currentEntitlement) : "essencial",
      subscription_active: Boolean(currentEntitlement),
      ...(currentEntitlement ? { trial_ends_at: null } : {}),
    })
    .eq("user_id", userId);
  if (profileError) throw profileError;

  const guardianRequestId = metadataString(subscription.metadata, "guardian_request_id");
  if (guardianRequestId) {
    const { error: guardianError } = await supabase
      .from("guardian_checkout_requests")
      .update({ status: "completed", stripe_customer_id: customerId })
      .eq("id", guardianRequestId)
      .eq("beneficiary_user_id", userId);
    if (guardianError) throw guardianError;
  }
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error("Stripe webhook environment is incomplete");
    return json({ error: "Webhook is not configured" }, 503);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing Stripe signature" }, 400);

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    return json({ error: "Invalid webhook signature" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });
  if (insertError) {
    if (insertError.code === "23505") return json({ received: true, duplicate: true });
    console.error("Could not register Stripe event:", insertError.message);
    return json({ error: "Could not register event" }, 500);
  }

  try {
    if (
      event.type === "customer.subscription.created"
      || event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      // Stripe can deliver events out of order. Fetch the latest canonical
      // subscription object instead of trusting an older event snapshot.
      const eventSubscription = event.data.object as Stripe.Subscription;
      const currentSubscription = await stripe.subscriptions.retrieve(eventSubscription.id);
      await syncSubscription(supabase, stripe, currentSubscription);
    } else if (
      event.type === "checkout.session.completed"
      || event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(supabase, stripe, subscription);
      }
    }
    return json({ received: true });
  } catch (error) {
    // Remove the idempotency marker so Stripe can retry a failed event.
    await supabase.from("stripe_webhook_events").delete().eq("stripe_event_id", event.id);
    console.error("Stripe webhook processing failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Webhook processing failed" }, 500);
  }
});
