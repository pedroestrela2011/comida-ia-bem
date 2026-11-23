-- Allow an authenticated guardian to review and revoke only the health-data authorizations they granted.
-- If no other age-appropriate authorization remains, clear the beneficiary's stored health fields.

CREATE OR REPLACE FUNCTION public.list_guardian_health_data_consents()
RETURNS TABLE (
  consent_id uuid,
  beneficiary_user_id uuid,
  beneficiary_name text,
  guardian_relationship text,
  granted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT ON (c.user_id)
    c.id,
    c.user_id,
    COALESCE(p.nome, 'Conta do adolescente'),
    c.guardian_relationship,
    c.granted_at
  FROM public.health_data_consents AS c
  LEFT JOIN public.profiles AS p ON p.user_id = c.user_id
  WHERE c.authorization_type = 'guardian'
    AND c.guardian_user_id = auth.uid()
    AND c.revoked_at IS NULL
  ORDER BY c.user_id, c.granted_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.revoke_guardian_health_data_consent(
  p_consent_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_guardian_id uuid := auth.uid();
  v_beneficiary_id uuid;
  v_birth_date date;
  v_age integer;
  v_has_valid_authorization boolean := false;
BEGIN
  IF v_guardian_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  -- Resolve the beneficiary only through a consent actually granted by this account.
  SELECT c.user_id
    INTO v_beneficiary_id
  FROM public.health_data_consents AS c
  WHERE c.id = p_consent_id
    AND c.authorization_type = 'guardian'
    AND c.guardian_user_id = v_guardian_id
    AND c.revoked_at IS NULL
  FOR UPDATE;

  IF v_beneficiary_id IS NULL THEN
    RAISE EXCEPTION 'Autorização não encontrada ou já revogada';
  END IF;

  -- Revoke every active grant this same guardian made for this beneficiary.
  UPDATE public.health_data_consents
  SET revoked_at = now()
  WHERE user_id = v_beneficiary_id
    AND authorization_type = 'guardian'
    AND guardian_user_id = v_guardian_id
    AND revoked_at IS NULL;

  SELECT p.data_nascimento
    INTO v_birth_date
  FROM public.profiles AS p
  WHERE p.user_id = v_beneficiary_id
  FOR UPDATE;

  IF v_birth_date IS NOT NULL THEN
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

    SELECT EXISTS (
      SELECT 1
      FROM public.health_data_consents AS c
      WHERE c.user_id = v_beneficiary_id
        AND c.revoked_at IS NULL
        AND (
          (v_age >= 18 AND c.authorization_type = 'self')
          OR
          (v_age < 18 AND c.authorization_type = 'guardian'
            AND c.guardian_user_id IS NOT NULL
            AND c.guardian_user_id <> v_beneficiary_id
            AND COALESCE(trim(c.guardian_relationship), '') <> '')
        )
    ) INTO v_has_valid_authorization;
  END IF;

  -- Keep the data only if another authorization valid for the beneficiary's current age remains.
  IF NOT v_has_valid_authorization THEN
    UPDATE public.profiles
    SET
      peso_kg = NULL,
      altura_cm = NULL,
      imc = NULL,
      objetivo = NULL,
      nivel_atividade = NULL,
      refeicoes_dia = NULL,
      restricoes_alimentares = ARRAY[]::text[],
      alergias = NULL,
      condicoes_saude = ARRAY[]::text[],
      condicoes_outras = NULL,
      onboarding_completo = false
    WHERE user_id = v_beneficiary_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.list_guardian_health_data_consents() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_guardian_health_data_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_guardian_health_data_consents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_guardian_health_data_consent(uuid) TO authenticated;
