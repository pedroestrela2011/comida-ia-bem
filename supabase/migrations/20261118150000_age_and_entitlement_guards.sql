-- Enforce minimum age and keep account entitlements server-controlled.
-- Users aged 12-17 receive the permanent base tier (essencial) without a paid trial.
-- Adults receive the existing seven-day trial.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  birth_date date;
  account_age integer;
  trial_end timestamptz;
BEGIN
  BEGIN
    birth_date := NULLIF(NEW.raw_user_meta_data->>'data_nascimento', '')::date;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Data de nascimento inválida';
  END;

  IF birth_date IS NULL OR birth_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Data de nascimento obrigatória e válida';
  END IF;

  account_age := EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::integer;

  IF account_age < 12 THEN
    RAISE EXCEPTION 'É necessário ter pelo menos 12 anos completos para criar uma conta';
  END IF;

  IF account_age >= 18 THEN
    trial_end := now() + interval '7 days';
  ELSE
    trial_end := NULL;
  END IF;

  INSERT INTO public.profiles (
    user_id, nome, data_nascimento, pais, plano, trial_ends_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    birth_date,
    NEW.raw_user_meta_data->>'pais',
    'essencial',
    trial_end
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A normal authenticated user may update their profile, but not their
  -- birth date, subscription plan, or trial entitlement.
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
    IF NEW.data_nascimento IS DISTINCT FROM OLD.data_nascimento
       OR NEW.plano IS DISTINCT FROM OLD.plano
       OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
      RAISE EXCEPTION 'Campos de idade e assinatura não podem ser alterados diretamente';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_entitlements ON public.profiles;
CREATE TRIGGER protect_profile_entitlements
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();

-- Existing profiles retain their current plan/trial values. Accounts whose
-- birth date is missing or invalid must be reviewed before paid checkout is enabled.
