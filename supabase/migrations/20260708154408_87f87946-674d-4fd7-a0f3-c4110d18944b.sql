
CREATE TABLE public.chatbot_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);
GRANT SELECT ON public.chatbot_usage TO authenticated;
GRANT ALL ON public.chatbot_usage TO service_role;
ALTER TABLE public.chatbot_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chatbot usage" ON public.chatbot_usage FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_chatbot_usage_updated_at BEFORE UPDATE ON public.chatbot_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
