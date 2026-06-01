CREATE TABLE public.favorite_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'receitas',
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_recipes TO authenticated;
GRANT ALL ON public.favorite_recipes TO service_role;

ALTER TABLE public.favorite_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.favorite_recipes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.favorite_recipes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.favorite_recipes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_favorite_recipes_user_created ON public.favorite_recipes(user_id, created_at DESC);