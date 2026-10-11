CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nome text NOT NULL,
  email text NOT NULL,
  assunto text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_nome_len CHECK (char_length(nome) BETWEEN 1 AND 100),
  CONSTRAINT support_email_len CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT support_assunto_len CHECK (char_length(assunto) BETWEEN 1 AND 150),
  CONSTRAINT support_mensagem_len CHECK (char_length(mensagem) BETWEEN 10 AND 2000)
);

GRANT INSERT ON public.support_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send support messages"
ON public.support_messages FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can view support messages"
ON public.support_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support messages"
ON public.support_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete support messages"
ON public.support_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));