CREATE OR REPLACE FUNCTION public.auto_grant_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Administrator roles are managed only through the protected admin workflow.
  RETURN NEW;
END;
$function$;

ALTER TABLE public.profiles
  ADD COLUMN subscription_active boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_profile_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres') AND (
    NEW.plano IS DISTINCT FROM OLD.plano
    OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
    OR NEW.subscription_active IS DISTINCT FROM OLD.subscription_active
  ) THEN
    RAISE EXCEPTION 'Os dados da assinatura são atualizados somente pelo servidor';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_subscription_fields ON public.profiles;
CREATE TRIGGER protect_profile_subscription_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_subscription_fields();

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.has_plan_access(_user_id uuid, _required_plan text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  required_rank integer;
BEGIN
  required_rank := CASE _required_plan
    WHEN 'essencial' THEN 1
    WHEN 'equilibrio' THEN 2
    WHEN 'performance' THEN 3
    ELSE 0
  END;
  IF _user_id IS NULL OR required_rank = 0 THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND subscription_active
      AND CASE plano
        WHEN 'essencial' THEN 1
        WHEN 'equilibrio' THEN 2
        WHEN 'performance' THEN 3
        ELSE 0
      END >= required_rank
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.has_plan_access(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_plan_access(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can access progress with age-appropriate health consent" ON public.progress_records;
CREATE POLICY "Users can access progress with age-appropriate health consent"
ON public.progress_records FOR ALL TO authenticated
USING (auth.uid() = user_id AND public.has_valid_health_consent(auth.uid()) AND public.has_plan_access(auth.uid(), 'equilibrio'))
WITH CHECK (auth.uid() = user_id AND public.has_valid_health_consent(auth.uid()) AND public.has_plan_access(auth.uid(), 'equilibrio'));

DROP POLICY IF EXISTS "Users can view own scores" ON public.daily_scores;
CREATE POLICY "Users can view own scores" ON public.daily_scores
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "Users can insert own scores" ON public.daily_scores;
CREATE POLICY "Users can insert own scores" ON public.daily_scores
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "Users can update own scores" ON public.daily_scores;
CREATE POLICY "Users can update own scores" ON public.daily_scores
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'))
WITH CHECK (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));

DROP POLICY IF EXISTS "Users can view own actions" ON public.daily_actions;
CREATE POLICY "Users can view own actions" ON public.daily_actions
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "Users can insert own actions" ON public.daily_actions;
CREATE POLICY "Users can insert own actions" ON public.daily_actions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "Users can update own actions" ON public.daily_actions;
CREATE POLICY "Users can update own actions" ON public.daily_actions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'))
WITH CHECK (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));

DROP POLICY IF EXISTS "user_xp select own" ON public.user_xp;
CREATE POLICY "user_xp select own" ON public.user_xp
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "user_xp insert own" ON public.user_xp;
DROP POLICY IF EXISTS "user_xp update own" ON public.user_xp;

DROP POLICY IF EXISTS "xp_events select own" ON public.xp_events;
CREATE POLICY "xp_events select own" ON public.xp_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "xp_events insert own" ON public.xp_events;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_plan_access(auth.uid(), 'performance'));

CREATE OR REPLACE FUNCTION public.ensure_user_xp()
RETURNS public.user_xp
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  v_row public.user_xp;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF NOT public.has_plan_access(v_user_id, 'performance') THEN
    RAISE EXCEPTION 'Recurso exclusivo do plano Performance';
  END IF;
  INSERT INTO public.user_xp (user_id, shield_month)
  VALUES (v_user_id, v_month)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_row FROM public.user_xp WHERE user_id = v_user_id FOR UPDATE;
  IF v_row.shield_month IS DISTINCT FROM v_month THEN
    UPDATE public.user_xp
    SET streak_shield_available = true, shield_month = v_month
    WHERE user_id = v_user_id
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_xp(p_action text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS public.user_xp
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_xp;
  v_amount integer;
  v_bonus integer := 0;
  v_today date := CURRENT_DATE;
  v_diff integer;
  v_new_streak integer;
  v_new_longest integer;
  v_shield_available boolean;
  v_streak_lost boolean := false;
  v_event_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF NOT public.has_plan_access(v_user_id, 'performance') THEN
    RAISE EXCEPTION 'Recurso exclusivo do plano Performance';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_user_id AND gamificacao_ativa
  ) THEN
    RAISE EXCEPTION 'A Jornada de Evolução está desativada';
  END IF;
  IF jsonb_typeof(v_event_metadata) <> 'object' THEN
    RAISE EXCEPTION 'Metadados inválidos';
  END IF;
  v_amount := CASE p_action
    WHEN 'meal_completed' THEN 10
    WHEN 'cardapio' THEN 20
    WHEN 'analisador' THEN 15
    WHEN 'receita' THEN 15
    WHEN 'esporte' THEN 25
    WHEN 'progresso' THEN 20
    WHEN 'pdf' THEN 10
    ELSE 0
  END;
  IF v_amount = 0 THEN RAISE EXCEPTION 'Ação de XP inválida'; END IF;

  SELECT * INTO v_row FROM public.ensure_user_xp();
  SELECT * INTO v_row FROM public.user_xp WHERE user_id = v_user_id FOR UPDATE;
  v_new_streak := v_row.current_streak;
  v_new_longest := v_row.longest_streak;
  v_shield_available := v_row.streak_shield_available;

  IF v_row.last_action_date IS DISTINCT FROM v_today THEN
    IF v_row.last_action_date IS NOT NULL THEN
      v_diff := v_today - v_row.last_action_date;
      IF v_diff = 1 THEN
        v_new_streak := v_new_streak + 1;
      ELSIF v_diff > 1 THEN
        IF v_shield_available THEN
          v_shield_available := false;
          v_new_streak := v_new_streak + 1;
        ELSE
          v_streak_lost := true;
          v_new_streak := 1;
        END IF;
      END IF;
    ELSE
      v_new_streak := 1;
    END IF;
    v_new_longest := GREATEST(v_new_longest, v_new_streak);
    IF v_new_streak = 7 THEN v_bonus := 100; END IF;
    IF v_new_streak = 30 THEN v_bonus := 500; END IF;
  END IF;

  IF v_streak_lost THEN
    v_event_metadata := v_event_metadata || jsonb_build_object('streak_lost', true);
  END IF;
  INSERT INTO public.xp_events (user_id, action_type, xp_amount, metadata)
  VALUES (v_user_id, p_action, v_amount, v_event_metadata);
  IF v_bonus > 0 THEN
    INSERT INTO public.xp_events (user_id, action_type, xp_amount, metadata)
    VALUES (
      v_user_id,
      CASE WHEN v_new_streak = 30 THEN 'bonus_streak_30' ELSE 'bonus_streak_7' END,
      v_bonus,
      jsonb_build_object('streak', v_new_streak)
    );
  END IF;

  UPDATE public.user_xp
  SET total_xp = total_xp + v_amount + v_bonus,
      current_streak = v_new_streak,
      longest_streak = v_new_longest,
      last_action_date = v_today,
      streak_shield_available = v_shield_available,
      shield_month = COALESCE(v_row.shield_month, to_char(CURRENT_DATE, 'YYYY-MM'))
  WHERE user_id = v_user_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_user_xp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_xp(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_xp() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_xp(text, jsonb) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone reads policy versions" ON public.privacy_policy_versions;
CREATE POLICY "Anyone reads effective policy versions"
ON public.privacy_policy_versions
FOR SELECT TO anon, authenticated
USING (effective_at <= CURRENT_DATE);