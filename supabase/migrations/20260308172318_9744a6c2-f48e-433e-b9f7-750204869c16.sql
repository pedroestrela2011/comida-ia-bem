
CREATE TABLE public.progress_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  peso numeric,
  cintura numeric,
  braco numeric,
  quadril numeric,
  perna numeric,
  nivel_energia text NOT NULL DEFAULT 'medio',
  frequencia_exercicios integer DEFAULT 0,
  qualidade_sono text NOT NULL DEFAULT 'regular',
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.progress_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.progress_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.progress_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.progress_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
