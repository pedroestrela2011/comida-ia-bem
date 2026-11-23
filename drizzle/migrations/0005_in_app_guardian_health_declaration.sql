ALTER TABLE public.health_data_consents ADD COLUMN IF NOT EXISTS declaration_context text NOT NULL DEFAULT 'legacy';

CREATE OR REPLACE FUNCTION public.has_valid_health_consent(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_birth date; v_age integer;
BEGIN
  SELECT data_nascimento INTO v_birth FROM public.profiles WHERE user_id = _user_id;
  IF v_birth IS NULL OR v_birth > CURRENT_DATE THEN RETURN false; END IF;
  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth))::integer;
  RETURN EXISTS (SELECT 1 FROM public.health_data_consents c WHERE c.user_id = _user_id AND c.revoked_at IS NULL AND (
    (v_age >= 18 AND c.authorization_type = 'self')
    OR (v_age >= 12 AND v_age < 18 AND c.authorization_type = 'guardian' AND (
      c.declaration_context = 'in_app_guardian_declaration'
      OR (c.guardian_user_id IS NOT NULL AND c.guardian_user_id <> c.user_id AND COALESCE(trim(c.guardian_relationship), '') <> '')))));
END $$;
REVOKE ALL ON FUNCTION public.has_valid_health_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_valid_health_consent(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.compliance_audit_logs TO authenticated;
GRANT ALL ON public.compliance_audit_logs TO service_role;
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.compliance_audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.privacy_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  effective_at date NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.privacy_policy_versions TO anon, authenticated;
GRANT ALL ON public.privacy_policy_versions TO service_role;
ALTER TABLE public.privacy_policy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads policy versions" ON public.privacy_policy_versions FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.privacy_policy_versions (version, effective_at, summary) VALUES ('2026-11-23', '2026-11-23', 'Autorização de dados de saúde de adolescentes passa a ser declarada pelo responsável legal diretamente na conta.') ON CONFLICT (version) DO NOTHING;

CREATE OR REPLACE FUNCTION public.save_health_profile_with_consent(p_profile_data jsonb, p_policy_version text, p_consent_text text, p_confirm_consent boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id uuid := auth.uid(); v_birth_date date; v_age integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT data_nascimento INTO v_birth_date FROM public.profiles WHERE user_id = v_user_id;
  IF v_birth_date IS NULL THEN RAISE EXCEPTION 'Data de nascimento não encontrada'; END IF;
  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;
  IF v_age < 12 THEN RAISE EXCEPTION 'Idade mínima de 12 anos'; END IF;
  IF p_confirm_consent AND NOT public.has_valid_health_consent(v_user_id) THEN
    IF COALESCE(trim(p_policy_version), '') = '' OR COALESCE(trim(p_consent_text), '') = '' THEN RAISE EXCEPTION 'Versão e texto do consentimento são obrigatórios'; END IF;
    INSERT INTO public.health_data_consents (user_id, policy_version, purpose, consent_text, authorization_type, declaration_context)
    VALUES (v_user_id, p_policy_version, 'Personalização de cardápios, receitas, alertas alimentares e recursos solicitados pelo usuário', p_consent_text,
      CASE WHEN v_age < 18 THEN 'guardian' ELSE 'self' END,
      CASE WHEN v_age < 18 THEN 'in_app_guardian_declaration' ELSE 'in_app_self' END);
    INSERT INTO public.compliance_audit_logs (user_id, event_type, details) VALUES (v_user_id, 'health_consent_granted', jsonb_build_object('policy_version', p_policy_version, 'minor', v_age < 18));
  END IF;
  IF NOT public.has_valid_health_consent(v_user_id) THEN RAISE EXCEPTION 'É necessária autorização válida para salvar e utilizar dados de saúde'; END IF;
  UPDATE public.profiles AS p SET peso_kg = v.peso_kg, altura_cm = v.altura_cm, imc = v.imc, objetivo = v.objetivo, nivel_atividade = v.nivel_atividade, refeicoes_dia = v.refeicoes_dia, restricoes_alimentares = v.restricoes_alimentares, alergias = v.alergias, condicoes_saude = v.condicoes_saude, condicoes_outras = v.condicoes_outras, onboarding_completo = COALESCE(v.onboarding_completo, p.onboarding_completo)
  FROM jsonb_to_record(p_profile_data) AS v(peso_kg numeric, altura_cm numeric, imc numeric, objetivo text, nivel_atividade text, refeicoes_dia integer, restricoes_alimentares text[], alergias text, condicoes_saude text[], condicoes_outras text, onboarding_completo boolean)
  WHERE p.user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_health_data_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NOT (NEW.peso_kg IS DISTINCT FROM OLD.peso_kg OR NEW.altura_cm IS DISTINCT FROM OLD.altura_cm OR NEW.imc IS DISTINCT FROM OLD.imc OR NEW.objetivo IS DISTINCT FROM OLD.objetivo OR NEW.nivel_atividade IS DISTINCT FROM OLD.nivel_atividade OR NEW.refeicoes_dia IS DISTINCT FROM OLD.refeicoes_dia OR NEW.restricoes_alimentares IS DISTINCT FROM OLD.restricoes_alimentares OR NEW.alergias IS DISTINCT FROM OLD.alergias OR NEW.condicoes_saude IS DISTINCT FROM OLD.condicoes_saude OR NEW.condicoes_outras IS DISTINCT FROM OLD.condicoes_outras) THEN RETURN NEW; END IF;
  IF NEW.peso_kg IS NULL AND NEW.altura_cm IS NULL AND NEW.imc IS NULL AND NEW.objetivo IS NULL AND NEW.nivel_atividade IS NULL AND NEW.refeicoes_dia IS NULL AND COALESCE(cardinality(NEW.restricoes_alimentares), 0) = 0 AND NEW.alergias IS NULL AND COALESCE(cardinality(NEW.condicoes_saude), 0) = 0 AND NEW.condicoes_outras IS NULL THEN RETURN NEW; END IF;
  IF NOT public.has_valid_health_consent(OLD.user_id) THEN RAISE EXCEPTION 'Autorização válida para dados de saúde não encontrada'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_health_data_consent()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  UPDATE public.health_data_consents SET revoked_at = now() WHERE user_id = auth.uid() AND revoked_at IS NULL;
  UPDATE public.profiles SET peso_kg = NULL, altura_cm = NULL, imc = NULL, objetivo = NULL, nivel_atividade = NULL, refeicoes_dia = NULL, restricoes_alimentares = ARRAY[]::text[], alergias = NULL, condicoes_saude = ARRAY[]::text[], condicoes_outras = NULL, onboarding_completo = false WHERE user_id = auth.uid();
  DELETE FROM public.progress_records WHERE user_id = auth.uid();
  INSERT INTO public.compliance_audit_logs (user_id, event_type) VALUES (auth.uid(), 'health_consent_revoked');
END $$;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can access progress with age-appropriate health consent" ON public.progress_records;
CREATE POLICY "Users can access progress with age-appropriate health consent" ON public.progress_records FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_valid_health_consent(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_valid_health_consent(auth.uid()));