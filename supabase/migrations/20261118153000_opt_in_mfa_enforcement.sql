-- Enforce AAL2 for users who explicitly enable TOTP MFA.
-- This is opt-in: users without a row in user_mfa_enforcement retain the
-- existing RLS behavior. The helper is SECURITY DEFINER to avoid RLS recursion.

CREATE TABLE IF NOT EXISTS public.user_mfa_enforcement (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_mfa_enforcement ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_mfa_enforcement FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_mfa_enforcement TO authenticated;
GRANT ALL ON TABLE public.user_mfa_enforcement TO service_role;

DROP POLICY IF EXISTS "Users can view own MFA enforcement" ON public.user_mfa_enforcement;
CREATE POLICY "Users can view own MFA enforcement"
  ON public.user_mfa_enforcement FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can enable own MFA enforcement" ON public.user_mfa_enforcement;
CREATE POLICY "Users can enable own MFA enforcement"
  ON public.user_mfa_enforcement FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.jwt() ->> 'aal' = 'aal2');

DROP POLICY IF EXISTS "Users can disable own MFA enforcement" ON public.user_mfa_enforcement;
CREATE POLICY "Users can disable own MFA enforcement"
  ON public.user_mfa_enforcement FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND auth.jwt() ->> 'aal' = 'aal2');

CREATE OR REPLACE FUNCTION public.user_requires_mfa()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_mfa_enforcement
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_requires_mfa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_requires_mfa() TO authenticated;

-- Add a restrictive AAL2 condition to every currently RLS-enabled public
-- table. Existing ownership and access policies remain in force as well.
DO $$
DECLARE
  target_table text;
BEGIN
  FOR target_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND c.relname <> 'user_mfa_enforcement'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS mfa_aal2_required ON public.%I',
      target_table
    );
    EXECUTE format(
      'CREATE POLICY mfa_aal2_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.user_requires_mfa() OR auth.jwt() ->> ''aal'' = ''aal2'') WITH CHECK (NOT public.user_requires_mfa() OR auth.jwt() ->> ''aal'' = ''aal2'')',
      target_table
    );
  END LOOP;
END;
$$;
