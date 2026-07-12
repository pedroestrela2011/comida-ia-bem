
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS peso_kg numeric,
  ADD COLUMN IF NOT EXISTS altura_cm numeric,
  ADD COLUMN IF NOT EXISTS imc numeric,
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS nivel_atividade text,
  ADD COLUMN IF NOT EXISTS refeicoes_dia int,
  ADD COLUMN IF NOT EXISTS restricoes_alimentares text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS alergias text,
  ADD COLUMN IF NOT EXISTS condicoes_saude text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS condicoes_outras text,
  ADD COLUMN IF NOT EXISTS unidade_peso text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS unidade_altura text DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt',
  ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _pais text := NEW.raw_user_meta_data->>'pais';
  _health jsonb := NEW.raw_user_meta_data->'health';
  _unidade_peso text := CASE WHEN _pais = 'Estados Unidos' THEN 'lb' ELSE 'kg' END;
  _unidade_altura text := CASE WHEN _pais = 'Estados Unidos' THEN 'ft' ELSE 'cm' END;
  _idioma text := CASE WHEN _pais = 'Brasil' THEN 'pt' ELSE 'en' END;
  _peso numeric := NULLIF(_health->>'peso_kg','')::numeric;
  _altura numeric := NULLIF(_health->>'altura_cm','')::numeric;
  _imc numeric := CASE
    WHEN _peso IS NOT NULL AND _altura IS NOT NULL AND _altura > 0
    THEN round((_peso / ((_altura/100.0) * (_altura/100.0)))::numeric, 2)
    ELSE NULL
  END;
BEGIN
  INSERT INTO public.profiles (
    user_id, nome, data_nascimento, pais, plano, trial_ends_at,
    peso_kg, altura_cm, imc, objetivo, nivel_atividade, refeicoes_dia,
    restricoes_alimentares, alergias, condicoes_saude, condicoes_outras,
    unidade_peso, unidade_altura, idioma, onboarding_completo
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'data_nascimento' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'data_nascimento')::DATE
      ELSE NULL
    END,
    _pais,
    COALESCE(NEW.raw_user_meta_data->>'plano', 'essencial'),
    now() + interval '7 days',
    _peso,
    _altura,
    _imc,
    _health->>'objetivo',
    _health->>'nivel_atividade',
    NULLIF(_health->>'refeicoes_dia','')::int,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(_health->'restricoes_alimentares')),
      ARRAY[]::text[]
    ),
    _health->>'alergias',
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(_health->'condicoes_saude')),
      ARRAY[]::text[]
    ),
    _health->>'condicoes_outras',
    _unidade_peso,
    _unidade_altura,
    _idioma,
    COALESCE((_health->>'onboarding_completo')::boolean, _health IS NOT NULL)
  );
  RETURN NEW;
END;
$function$;
