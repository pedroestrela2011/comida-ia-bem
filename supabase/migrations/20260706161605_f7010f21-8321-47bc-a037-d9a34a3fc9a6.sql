
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gamificacao_ativa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gamificacao_onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_action_date date,
  streak_shield_available boolean NOT NULL DEFAULT true,
  shield_month text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_xp TO authenticated;
GRANT ALL ON public.user_xp TO service_role;

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_xp select own" ON public.user_xp FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_xp insert own" ON public.user_xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_xp update own" ON public.user_xp FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_xp_updated_at BEFORE UPDATE ON public.user_xp
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  xp_amount integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_events select own" ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "xp_events insert own" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS xp_events_user_action_idx ON public.xp_events(user_id, action_type);
CREATE INDEX IF NOT EXISTS xp_events_user_created_idx ON public.xp_events(user_id, created_at DESC);
