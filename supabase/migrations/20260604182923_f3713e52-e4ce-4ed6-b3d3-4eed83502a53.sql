CREATE TABLE public.shared_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  nome TEXT NOT NULL,
  dados JSONB NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX shared_recipes_recipient_idx ON public.shared_recipes(recipient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_recipes TO authenticated;
GRANT ALL ON public.shared_recipes TO service_role;

ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view their received recipes"
ON public.shared_recipes FOR SELECT TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Authenticated users can send recipes"
ON public.shared_recipes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update (mark as read)"
ON public.shared_recipes FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can delete their received recipes"
ON public.shared_recipes FOR DELETE TO authenticated
USING (auth.uid() = recipient_id);