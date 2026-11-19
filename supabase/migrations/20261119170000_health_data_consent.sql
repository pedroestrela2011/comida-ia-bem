-- Record explicit, versioned consent before using health-profile data.
CREATE TABLE IF NOT EXISTS public.health_data_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  purpose text NOT NULL,
  consent_text text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS health_data_consents_active_user_idx
  ON public.health_data_consents (user_id, granted_at DESC)
  WHERE revoked_at IS NULL;

ALTER TABLE public.health_data_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.health_data_consents FROM anon, authenticated;
GRANT SELECT ON TABLE public.health_data_consents TO authenticated;

CREATE POLICY "Users can read their own health consent history"
  ON public.health_data_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  SELECT data_nascimento INTO v_birth_date
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF v_birth_date IS NULL THEN
    RAISE EXCEPTION 'Data de nascimento não encontrada';
  END IF;

  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

  -- This self-consent flow is intentionally restricted to adults.
  -- A guardian authorization flow must be implemented and verified separately for minors.
  IF v_age < 18 THEN
    RAISE EXCEPTION 'O cadastro de dados de saúde exige autorização de responsável. Este recurso ainda não está habilitado para menores.';
  END IF;

  IF p_confirm_consent THEN
    IF COALESCE(trim(p_policy_version), '') = '' OR COALESCE(trim(p_consent_text), '') = '' THEN
      RAISE EXCEPTION 'Versão e texto do consentimento são obrigatórios';
    END IF;

    INSERT INTO public.health_data_consents (user_id, policy_version, purpose, consent_text)
    VALUES (
      v_user_id,
      p_policy_version,
      'Personalização de cardápios, receitas, alertas alimentares e recursos solicitados pelo usuário',
      p_consent_text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.health_data_consents
    WHERE user_id = v_user_id AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'É necessário conceder consentimento específico para salvar e utilizar dados de saúde';
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
    peso_kg numeric,
    altura_cm numeric,
    imc numeric,
    objetivo text,
    nivel_atividade text,
    refeicoes_dia integer,
    restricoes_alimentares text[],
    alergias text,
    condicoes_saude text[],
    condicoes_outras text,
    onboarding_completo boolean
  )
  WHERE p.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_health_data_consent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  UPDATE public.health_data_consents
  SET revoked_at = now()
  WHERE user_id = auth.uid() AND revoked_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_health_data_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (
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
  ) AND NOT EXISTS (
    SELECT 1 FROM public.health_data_consents
    WHERE user_id = OLD.user_id AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Consentimento específico para dados de saúde não encontrado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_health_data_consent ON public.profiles;
CREATE TRIGGER enforce_health_data_consent
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_health_data_consent();

REVOKE ALL ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_health_data_consent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_health_data_consent() TO authenticated;
