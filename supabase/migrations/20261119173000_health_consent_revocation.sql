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
  WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_health_data_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_active_consent boolean;
  v_is_clearing boolean;
  v_health_changed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_health_changed :=
    NEW.peso_kg IS DISTINCT FROM OLD.peso_kg OR
    NEW.altura_cm IS DISTINCT FROM OLD.altura_cm OR
    NEW.imc IS DISTINCT FROM OLD.imc OR
    NEW.objetivo IS DISTINCT FROM OLD.objetivo OR
    NEW.nivel_atividade IS DISTINCT FROM OLD.nivel_atividade OR
    NEW.refeicoes_dia IS DISTINCT FROM OLD.refeicoes_dia OR
    NEW.restricoes_alimentares IS DISTINCT FROM OLD.restricoes_alimentares OR
    NEW.alergias IS DISTINCT FROM OLD.alergias OR
    NEW.condicoes_saude IS DISTINCT FROM OLD.condicoes_saude OR
    NEW.condicoes_outras IS DISTINCT FROM OLD.condicoes_outras;

  IF NOT v_health_changed THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.health_data_consents
    WHERE user_id = OLD.user_id AND revoked_at IS NULL
  ) INTO v_has_active_consent;

  v_is_clearing :=
    NEW.peso_kg IS NULL AND
    NEW.altura_cm IS NULL AND
    NEW.imc IS NULL AND
    NEW.objetivo IS NULL AND
    NEW.nivel_atividade IS NULL AND
    NEW.refeicoes_dia IS NULL AND
    COALESCE(cardinality(NEW.restricoes_alimentares), 0) = 0 AND
    NEW.alergias IS NULL AND
    COALESCE(cardinality(NEW.condicoes_saude), 0) = 0 AND
    NEW.condicoes_outras IS NULL;

  IF NOT v_has_active_consent AND NOT v_is_clearing THEN
    RAISE EXCEPTION 'Consentimento específico para dados de saúde não encontrado';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_health_data_consent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_health_data_consent() TO authenticated;
