-- Add trial_ends_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Update handle_new_user to set trial_ends_at = now() + 7 days
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, data_nascimento, pais, plano, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'data_nascimento' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'data_nascimento')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'pais',
    COALESCE(NEW.raw_user_meta_data->>'plano', 'essencial'),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$function$;

-- Backfill existing essencial users
UPDATE public.profiles
SET trial_ends_at = created_at + interval '7 days'
WHERE trial_ends_at IS NULL
  AND plano = 'essencial';

-- Ensure the auth trigger exists (in case it was missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();