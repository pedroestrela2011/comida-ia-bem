-- Purge historical health/progress entries when the beneficiary no longer has
-- an authorization that matches their current age.
CREATE OR REPLACE FUNCTION public.purge_progress_without_valid_health_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_birth_date date;
  v_age integer;
  v_has_valid_consent boolean := false;
BEGIN
  IF OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.data_nascimento
    INTO v_birth_date
  FROM public.profiles AS p
  WHERE p.user_id = NEW.user_id;

  IF v_birth_date IS NOT NULL AND v_birth_date <= CURRENT_DATE THEN
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

    SELECT EXISTS (
      SELECT 1
      FROM public.health_data_consents AS c
      WHERE c.user_id = NEW.user_id
        AND c.revoked_at IS NULL
        AND (
          (v_age >= 18 AND c.authorization_type = 'self')
          OR
          (v_age < 18 AND c.authorization_type = 'guardian'
            AND c.guardian_user_id IS NOT NULL
            AND c.guardian_user_id <> c.user_id
            AND COALESCE(trim(c.guardian_relationship), '') <> '')
        )
    ) INTO v_has_valid_consent;
  END IF;

  IF NOT v_has_valid_consent THEN
    DELETE FROM public.progress_records
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS purge_progress_after_health_consent_revocation
  ON public.health_data_consents;

CREATE TRIGGER purge_progress_after_health_consent_revocation
  AFTER UPDATE OF revoked_at ON public.health_data_consents
  FOR EACH ROW
  WHEN (OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL)
  EXECUTE FUNCTION public.purge_progress_without_valid_health_consent();

REVOKE ALL ON FUNCTION public.purge_progress_without_valid_health_consent() FROM PUBLIC, anon, authenticated;
