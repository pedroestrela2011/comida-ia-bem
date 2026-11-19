-- One-time, expiring invitation for an adult to contract a plan for a teen.
CREATE TABLE IF NOT EXISTS public.guardian_checkout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'checkout_created', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  guardian_name text,
  guardian_email text,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guardian_checkout_requests_beneficiary_idx
  ON public.guardian_checkout_requests (beneficiary_user_id, created_at DESC);

ALTER TABLE public.guardian_checkout_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.guardian_checkout_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.guardian_checkout_requests TO service_role;

DROP TRIGGER IF EXISTS update_guardian_checkout_requests_updated_at
  ON public.guardian_checkout_requests;
CREATE TRIGGER update_guardian_checkout_requests_updated_at
  BEFORE UPDATE ON public.guardian_checkout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
