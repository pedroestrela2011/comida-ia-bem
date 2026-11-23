CREATE TABLE IF NOT EXISTS public.health_data_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_version text NOT NULL,
  purpose text NOT NULL,
  consent_text text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  authorization_type text NOT NULL DEFAULT 'self',
  guardian_user_id uuid,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  CONSTRAINT health_data_consents_authorization_type_check CHECK (authorization_type IN ('self', 'guardian'))
);
GRANT SELECT ON public.health_data_consents TO authenticated;
GRANT ALL ON public.health_data_consents TO service_role;
ALTER TABLE public.health_data_consents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS health_data_consents_active_user_idx ON public.health_data_consents (user_id, granted_at DESC) WHERE revoked_at IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'health_data_consents' AND policyname = 'Users can read their own health consent history') THEN
    CREATE POLICY "Users can read their own health consent history" ON public.health_data_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.health_data_consent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  guardian_user_id uuid,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
GRANT ALL ON public.health_data_consent_requests TO service_role;
ALTER TABLE public.health_data_consent_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.health_data_consent_requests FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS health_data_consent_requests_beneficiary_idx ON public.health_data_consent_requests (beneficiary_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.guardian_checkout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checkout_created', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  guardian_name text,
  guardian_email text,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guardian_checkout_requests TO service_role;
ALTER TABLE public.guardian_checkout_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guardian_checkout_requests FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS guardian_checkout_requests_beneficiary_idx ON public.guardian_checkout_requests (beneficiary_user_id, created_at DESC);
DROP TRIGGER IF EXISTS update_guardian_checkout_requests_updated_at ON public.guardian_checkout_requests;
CREATE TRIGGER update_guardian_checkout_requests_updated_at BEFORE UPDATE ON public.guardian_checkout_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.save_health_profile_with_consent(p_profile_data jsonb, p_policy_version text, p_consent_text text, p_confirm_consent boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id uuid := auth.uid(); v_birth_date date; v_age integer; v_has_authorization boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT data_nascimento INTO v_birth_date FROM public.profiles WHERE user_id = v_user_id;
  IF v_birth_date IS NULL THEN RAISE EXCEPTION 'Data de nascimento não encontrada'; END IF;
  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;
  IF p_confirm_consent THEN
    IF v_age < 18 THEN RAISE EXCEPTION 'Menores não podem conceder consentimento de saúde em nome próprio'; END IF;
    IF COALESCE(trim(p_policy_version), '') = '' OR COALESCE(trim(p_consent_text), '') = '' THEN RAISE EXCEPTION 'Versão e texto do consentimento são obrigatórios'; END IF;
    INSERT INTO public.health_data_consents (user_id, policy_version, purpose, consent_text, authorization_type)
    VALUES (v_user_id, p_policy_version, 'Personalização de cardápios, receitas, alertas alimentares e recursos solicitados pelo usuário', p_consent_text, 'self');
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.health_data_consents c WHERE c.user_id = v_user_id AND c.revoked_at IS NULL AND ((v_age >= 18 AND c.authorization_type = 'self') OR (v_age < 18 AND c.authorization_type = 'guardian' AND c.guardian_user_id IS NOT NULL AND c.guardian_user_id <> v_user_id AND COALESCE(trim(c.guardian_relationship), '') <> ''))) INTO v_has_authorization;
  IF NOT v_has_authorization THEN RAISE EXCEPTION 'É necessária autorização válida para salvar e utilizar dados de saúde'; END IF;
  UPDATE public.profiles AS p SET peso_kg = v.peso_kg, altura_cm = v.altura_cm, imc = v.imc, objetivo = v.objetivo, nivel_atividade = v.nivel_atividade, refeicoes_dia = v.refeicoes_dia, restricoes_alimentares = v.restricoes_alimentares, alergias = v.alergias, condicoes_saude = v.condicoes_saude, condicoes_outras = v.condicoes_outras, onboarding_completo = COALESCE(v.onboarding_completo, p.onboarding_completo)
  FROM jsonb_to_record(p_profile_data) AS v(peso_kg numeric, altura_cm numeric, imc numeric, objetivo text, nivel_atividade text, refeicoes_dia integer, restricoes_alimentares text[], alergias text, condicoes_saude text[], condicoes_outras text, onboarding_completo boolean)
  WHERE p.user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_health_data_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_birth_date date; v_age integer; v_authorized boolean; v_clearing boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NOT (NEW.peso_kg IS DISTINCT FROM OLD.peso_kg OR NEW.altura_cm IS DISTINCT FROM OLD.altura_cm OR NEW.imc IS DISTINCT FROM OLD.imc OR NEW.objetivo IS DISTINCT FROM OLD.objetivo OR NEW.nivel_atividade IS DISTINCT FROM OLD.nivel_atividade OR NEW.refeicoes_dia IS DISTINCT FROM OLD.refeicoes_dia OR NEW.restricoes_alimentares IS DISTINCT FROM OLD.restricoes_alimentares OR NEW.alergias IS DISTINCT FROM OLD.alergias OR NEW.condicoes_saude IS DISTINCT FROM OLD.condicoes_saude OR NEW.condicoes_outras IS DISTINCT FROM OLD.condicoes_outras) THEN RETURN NEW; END IF;
  v_clearing := NEW.peso_kg IS NULL AND NEW.altura_cm IS NULL AND NEW.imc IS NULL AND NEW.objetivo IS NULL AND NEW.nivel_atividade IS NULL AND NEW.refeicoes_dia IS NULL AND COALESCE(cardinality(NEW.restricoes_alimentares), 0) = 0 AND NEW.alergias IS NULL AND COALESCE(cardinality(NEW.condicoes_saude), 0) = 0 AND NEW.condicoes_outras IS NULL;
  IF v_clearing THEN RETURN NEW; END IF;
  SELECT data_nascimento INTO v_birth_date FROM public.profiles WHERE user_id = OLD.user_id;
  v_age := CASE WHEN v_birth_date IS NULL THEN NULL ELSE EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer END;
  SELECT EXISTS (SELECT 1 FROM public.health_data_consents c WHERE c.user_id = OLD.user_id AND c.revoked_at IS NULL AND ((v_age >= 18 AND c.authorization_type = 'self') OR (v_age < 18 AND c.authorization_type = 'guardian' AND c.guardian_user_id IS NOT NULL AND c.guardian_user_id <> OLD.user_id AND COALESCE(trim(c.guardian_relationship), '') <> ''))) INTO v_authorized;
  IF NOT v_authorized THEN RAISE EXCEPTION 'Autorização válida para dados de saúde não encontrada'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_health_data_consent ON public.profiles;
CREATE TRIGGER enforce_health_data_consent BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_health_data_consent();

CREATE OR REPLACE FUNCTION public.revoke_health_data_consent()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  UPDATE public.health_data_consents SET revoked_at = now() WHERE user_id = auth.uid() AND revoked_at IS NULL;
  UPDATE public.profiles SET peso_kg = NULL, altura_cm = NULL, imc = NULL, objetivo = NULL, nivel_atividade = NULL, refeicoes_dia = NULL, restricoes_alimentares = ARRAY[]::text[], alergias = NULL, condicoes_saude = ARRAY[]::text[], condicoes_outras = NULL, onboarding_completo = false WHERE user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.list_guardian_health_data_consents()
RETURNS TABLE (consent_id uuid, beneficiary_user_id uuid, beneficiary_name text, guardian_relationship text, granted_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT DISTINCT ON (c.user_id) c.id, c.user_id, COALESCE(p.nome, 'Conta do adolescente'), c.guardian_relationship, c.granted_at
  FROM public.health_data_consents AS c LEFT JOIN public.profiles AS p ON p.user_id = c.user_id
  WHERE c.authorization_type = 'guardian' AND c.guardian_user_id = auth.uid() AND c.revoked_at IS NULL
  ORDER BY c.user_id, c.granted_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.revoke_guardian_health_data_consent(p_consent_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_guardian_id uuid := auth.uid(); v_beneficiary_id uuid; v_birth_date date; v_age integer; v_has_valid_authorization boolean := false;
BEGIN
  IF v_guardian_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT c.user_id INTO v_beneficiary_id FROM public.health_data_consents AS c WHERE c.id = p_consent_id AND c.authorization_type = 'guardian' AND c.guardian_user_id = v_guardian_id AND c.revoked_at IS NULL FOR UPDATE;
  IF v_beneficiary_id IS NULL THEN RAISE EXCEPTION 'Autorização não encontrada ou já revogada'; END IF;
  UPDATE public.health_data_consents SET revoked_at = now() WHERE user_id = v_beneficiary_id AND authorization_type = 'guardian' AND guardian_user_id = v_guardian_id AND revoked_at IS NULL;
  SELECT p.data_nascimento INTO v_birth_date FROM public.profiles AS p WHERE p.user_id = v_beneficiary_id FOR UPDATE;
  IF v_birth_date IS NOT NULL THEN
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;
    SELECT EXISTS (SELECT 1 FROM public.health_data_consents AS c WHERE c.user_id = v_beneficiary_id AND c.revoked_at IS NULL AND ((v_age >= 18 AND c.authorization_type = 'self') OR (v_age < 18 AND c.authorization_type = 'guardian' AND c.guardian_user_id IS NOT NULL AND c.guardian_user_id <> v_beneficiary_id AND COALESCE(trim(c.guardian_relationship), '') <> ''))) INTO v_has_valid_authorization;
  END IF;
  IF NOT v_has_valid_authorization THEN
    UPDATE public.profiles SET peso_kg = NULL, altura_cm = NULL, imc = NULL, objetivo = NULL, nivel_atividade = NULL, refeicoes_dia = NULL, restricoes_alimentares = ARRAY[]::text[], alergias = NULL, condicoes_saude = ARRAY[]::text[], condicoes_outras = NULL, onboarding_completo = false WHERE user_id = v_beneficiary_id;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_health_data_consent() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_guardian_health_data_consents() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_guardian_health_data_consent(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_health_data_consent() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_health_profile_with_consent(jsonb, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_health_data_consent() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_guardian_health_data_consents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_guardian_health_data_consent(uuid) TO authenticated;