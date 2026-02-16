
CREATE TABLE public.cardapios_salvos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cardapios_salvos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cardapios"
ON public.cardapios_salvos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cardapios"
ON public.cardapios_salvos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cardapios"
ON public.cardapios_salvos FOR DELETE
USING (auth.uid() = user_id);
