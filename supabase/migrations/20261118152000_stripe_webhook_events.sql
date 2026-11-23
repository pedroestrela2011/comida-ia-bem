-- Store processed Stripe event IDs to make webhook handling idempotent.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated;
GRANT ALL ON TABLE public.stripe_webhook_events TO service_role;
