-- Guardian authorization for sensitive health data belonging to minors.
ALTER TABLE public.health_data_consents
  ADD COLUMN IF NOT EXISTS authorization_type text NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS guardian_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_email text,
  ADD COLUMN IF NOT EXISTS guardian_relationship text;

ALTER TABLE public.health_data_consents
  DROP CONSTRAINT IF EXISTS health_data_consents_authorization_type_check;
ALTER TABLE public.health_data_consents
  ADD CONSTRAINT health_data_consents_authorization_type_check
  CHECK (authorization_type IN ('self', 'guardian'));

CREATE TABLE IF NOT EXISTS public.health_data_consent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  guardian_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS health_data_consent_requests_beneficiary_idx
  ON public.health_data_consent_requests (beneficiary_user_id, created_at DESC);
ALTER TABLE public.health_data_consent_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.health_data_consent_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.health_data_consent_requests TO service_role;

CREATE OR REPLACE FUNCTION public.save_health_profile_with_consent(
  p_profile_data jsonb,
  p_policy_version text,
  p_consent_text text,
  p_confirm_consent boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_birth_date date;
  v_age integer;
  v_has_authorization boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  SELECT data_nascimento INTO v_birth_date
  FROM public.profiles WHERE user_id = v_user_id;
  IF v_birth_date IS NULL THEN
    RAISE EXCEPTION 'Data de nascimento não encontrada';
  END IF;

  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

  IF p_confirm_consent THEN
    IF v_age < 18 THEN
      RAISE EXCEPTION 'Menores não podem conceder consentimento de saúde em nome próprio';
    END IF;
    IF COALESCE(trim(p_policy_version), '') = '' OR COALESCE(trim(p_consent_text), '') = '' THEN
      RAISE EXCEPTION 'Versão e texto do consentimento são obrigatórios';
    END IF;
    INSERT INTO public.health_data_consents
      (user_id, policy_version, purpose, consent_text, authorization_type)
    VALUES (
      v_user_id, p_policy_version,
      'Personalização de cardápios, receitas, alertas alimentares e recursos solicitados pelo usuário',
      p_consent_text, 'self'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.health_data_consents c
    WHERE c.user_id = v_user_id
      AND c.revoked_at IS NULL
      AND (
        (v_age >= 18 AND c.authorization_type = 'self')
        OR
        (v_age < 18 AND c.authorization_type = 'guardian'
          AND c.guardian_user_id IS NOT NULL
          AND c.guardian_user_id <> v_user_id
          AND COALESCE(trim(c.guardian_relationship), '') <> '')
      )
  ) INTO v_has_authorization;

  IF NOT v_has_authorization THEN
    RAISE EXCEPTION 'É necessária autorização válida para salvar e utilizar dados de saúde';
  END IF;

  UPDATE public.profiles AS p
  SET
    peso_kg = v.peso_kg,
    altura_cm = v.altura_cm,
    imc = v.imc,
    objetivo = v.objetivo,
    nivel_atividade = v.nivel_atividade,
    refeicoes_dia = v.refeicoes_dia,
    restricoes_alimentares = v.restricoes_alimentares,
    alergias = v.alergias,
    condicoes_saude = v.condicoes_saude,
    condicoes_outras = v.condicoes_outras,
    onboarding_completo = COALESCE(v.onboarding_completo, p.onboarding_completo)
  FROM jsonb_to_record(p_profile_data) AS v(
    peso_kg numeric, altura_cm numeric, imc numeric, objetivo text,
    nivel_atividade text, refeicoes_dia integer,
    restricoes_alimentares text[], alergias text,
    condicoes_saude text[], condicoes_outras text,
    onboarding_completo boolean
  )
  WHERE p.user_id = v_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_health_data_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_birth_date date;
  v_age integer;
  v_authorized boolean;
  v_clearing boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF NOT (
    NEW.peso_kg IS DISTINCT FROM OLD.peso_kg OR
    NEW.altura_cm IS DISTINCT FROM OLD.altura_cm OR
    NEW.imc IS DISTINCT FROM OLD.imc OR
    NEW.objetivo IS DISTINCT FROM OLD.objetivo OR
    NEW.nivel_atividade IS DISTINCT FROM OLD.nivel_atividade OR
    NEW.refeicoes_dia IS DISTINCT FROM OLD.refeicoes_dia OR
    NEW.restricoes_alimentares IS DISTINCT FROM OLD.restricoes_alimentares OR
    NEW.alergias IS DISTINCT FROM OLD.alergias OR
    NEW.condicoes_saude IS DISTINCT FROM OLD.condicoes_saude OR
    NEW.condicoes_outras IS DISTINCT FROM OLD.condicoes_outras
  ) THEN RETURN NEW; END IF;

  v_clearing :=
    NEW.peso_kg IS NULL AND NEW.altura_cm IS NULL AND NEW.imc IS NULL
    AND NEW.objetivo IS NULL AND NEW.nivel_atividade IS NULL
    AND NEW.refeicoes_dia IS NULL
    AND COALESCE(cardinality(NEW.restricoes_alimentares), 0) = 0
    AND NEW.alergias IS NULL
    AND COALESCE(cardinality(NEW.condicoes_saude), 0) = 0
    AND NEW.condicoes_outras IS NULL;
  IF v_clearing THEN RETURN NEW; END IF;

  SELECT data_nascimento INTO v_birth_date
  FROM public.profiles WHERE user_id = OLD.user_id;
  v_age := CASE WHEN v_birth_date IS NULL THEN NULL
    ELSE EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer END;

  SELECT EXISTS (
    SELECT 1 FROM public.health_data_consents c
    WHERE c.user_id = OLD.user_id AND c.revoked_at IS NULL
      AND (
        (v_age >= 18 AND c.authorization_type = 'self')
        OR (v_age < 18 AND c.authorization_type = 'guardian'
          AND c.guardian_user_id IS NOT NULL
          AND c.guardian_user_id <> OLD.user_id
          AND COALESCE(trim(c.guardian_relationship), '') <> '')
      )
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Autorização válida para dados de saúde não encontrada';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) TO authenticated;
