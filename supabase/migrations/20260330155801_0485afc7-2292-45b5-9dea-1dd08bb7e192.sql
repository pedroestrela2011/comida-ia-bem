
-- Daily actions: tracks each scored action per user per day
CREATE TABLE public.daily_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'cardapio', 'progresso', 'analisador', 'exercicio'
  action_date date NOT NULL DEFAULT CURRENT_DATE,
  points integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate action types per user per day
CREATE UNIQUE INDEX unique_daily_action ON public.daily_actions (user_id, action_type, action_date);

ALTER TABLE public.daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON public.daily_actions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions" ON public.daily_actions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON public.daily_actions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily scores: aggregated daily score + streak tracking
CREATE TABLE public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  total_score integer NOT NULL DEFAULT 0,
  cardapio_points integer NOT NULL DEFAULT 0,
  progresso_points integer NOT NULL DEFAULT 0,
  analisador_points integer NOT NULL DEFAULT 0,
  exercicio_points integer NOT NULL DEFAULT 0,
  consistencia_points integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_daily_score ON public.daily_scores (user_id, score_date);

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores" ON public.daily_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.daily_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON public.daily_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_scores;
