
CREATE TABLE public.pdf_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'receita',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pdf_downloads TO authenticated;
GRANT ALL ON public.pdf_downloads TO service_role;

ALTER TABLE public.pdf_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdf downloads"
ON public.pdf_downloads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdf downloads"
ON public.pdf_downloads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pdf_downloads_user_month ON public.pdf_downloads(user_id, created_at DESC);
