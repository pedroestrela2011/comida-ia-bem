CREATE TABLE public.premium_assistant_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT ON public.premium_assistant_usage TO authenticated;
GRANT ALL ON public.premium_assistant_usage TO service_role;

ALTER TABLE public.premium_assistant_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own premium assistant usage"
ON public.premium_assistant_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_premium_assistant_usage_updated_at
BEFORE UPDATE ON public.premium_assistant_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();