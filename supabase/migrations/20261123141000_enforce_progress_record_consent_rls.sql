-- Enforce consent at the database boundary, not only in the React screen.
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.progress_records;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress_records;

CREATE POLICY "Users can access progress with age-appropriate health consent"
  ON public.progress_records
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      JOIN public.health_data_consents AS c ON c.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND p.data_nascimento IS NOT NULL
        AND p.data_nascimento <= CURRENT_DATE
        AND c.revoked_at IS NULL
        AND (
          (
            EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento)) >= 18
            AND c.authorization_type = 'self'
          )
          OR
          (
            EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento)) < 18
            AND c.authorization_type = 'guardian'
            AND c.guardian_user_id IS NOT NULL
            AND c.guardian_user_id <> p.user_id
            AND COALESCE(trim(c.guardian_relationship), '') <> ''
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      JOIN public.health_data_consents AS c ON c.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND p.data_nascimento IS NOT NULL
        AND p.data_nascimento <= CURRENT_DATE
        AND c.revoked_at IS NULL
        AND (
          (
            EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento)) >= 18
            AND c.authorization_type = 'self'
          )
          OR
          (
            EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento)) < 18
            AND c.authorization_type = 'guardian'
            AND c.guardian_user_id IS NOT NULL
            AND c.guardian_user_id <> p.user_id
            AND COALESCE(trim(c.guardian_relationship), '') <> ''
          )
        )
    )
  );
