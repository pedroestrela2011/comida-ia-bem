
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own cardapios" ON public.cardapios_salvos;
DROP POLICY IF EXISTS "Users can insert their own cardapios" ON public.cardapios_salvos;
DROP POLICY IF EXISTS "Users can delete their own cardapios" ON public.cardapios_salvos;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view their own cardapios"
ON public.cardapios_salvos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cardapios"
ON public.cardapios_salvos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cardapios"
ON public.cardapios_salvos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
