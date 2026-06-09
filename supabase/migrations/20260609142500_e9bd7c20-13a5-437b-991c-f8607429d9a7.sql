
-- 1) has_role: restrict EXECUTE to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Revoke anon SELECT from all public tables (none are meant to be public)
REVOKE SELECT ON public.cardapios_salvos FROM anon;
REVOKE SELECT ON public.daily_actions FROM anon;
REVOKE SELECT ON public.daily_scores FROM anon;
REVOKE SELECT ON public.favorite_recipes FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.progress_records FROM anon;
REVOKE SELECT ON public.shared_recipes FROM anon;
REVOKE SELECT ON public.user_achievements FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;

-- 3) profiles policies: scope to authenticated role explicitly
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4) cardapios_salvos: add missing UPDATE policy
CREATE POLICY "Users can update their own cardapios"
  ON public.cardapios_salvos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5) Remove daily_scores from realtime publication to prevent unrestricted channel subscriptions
ALTER PUBLICATION supabase_realtime DROP TABLE public.daily_scores;

-- 6) Avatars bucket: remove broad listing policy. Public file URLs still work without storage.objects SELECT.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
