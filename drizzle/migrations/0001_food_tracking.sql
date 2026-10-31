CREATE TABLE public.food_tracking_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  cardapio_id uuid,
  cardapio_snapshot jsonb NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT ON public.food_tracking_weeks TO authenticated;
GRANT ALL ON public.food_tracking_weeks TO service_role;
ALTER TABLE public.food_tracking_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weeks select" ON public.food_tracking_weeks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own weeks insert" ON public.food_tracking_weeks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND extract(isodow from week_start) = 1);

CREATE TABLE public.food_tracking_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_id uuid NOT NULL REFERENCES public.food_tracking_weeks(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  meals jsonb NOT NULL DEFAULT '{}'::jsonb,
  finalized boolean NOT NULL DEFAULT false,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, day_date)
);
GRANT SELECT, INSERT, UPDATE ON public.food_tracking_days TO authenticated;
GRANT ALL ON public.food_tracking_days TO service_role;
ALTER TABLE public.food_tracking_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own days select" ON public.food_tracking_days FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own days insert" ON public.food_tracking_days FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own days update" ON public.food_tracking_days FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_food_tracking_day()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _w public.food_tracking_weeks;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.finalized THEN RAISE EXCEPTION 'Dia já finalizado'; END IF;
    NEW.user_id := OLD.user_id; NEW.week_id := OLD.week_id; NEW.day_date := OLD.day_date;
  END IF;
  SELECT * INTO _w FROM public.food_tracking_weeks WHERE id = NEW.week_id;
  IF _w.id IS NULL OR _w.user_id <> NEW.user_id THEN RAISE EXCEPTION 'Semana inválida'; END IF;
  IF NEW.day_date < _w.week_start OR NEW.day_date > _w.week_start + 6 THEN RAISE EXCEPTION 'Data fora da semana'; END IF;
  IF NEW.day_date > (now() AT TIME ZONE _w.timezone)::date THEN RAISE EXCEPTION 'Dia futuro'; END IF;
  IF NEW.finalized THEN NEW.finalized_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER validate_food_tracking_day BEFORE INSERT OR UPDATE ON public.food_tracking_days
FOR EACH ROW EXECUTE FUNCTION public.validate_food_tracking_day();

CREATE POLICY "meal photos read own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "meal photos insert own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);