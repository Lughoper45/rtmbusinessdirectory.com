DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'affiliates'
      AND policyname = 'Users can create own affiliate'
  ) THEN
    CREATE POLICY "Users can create own affiliate"
    ON public.affiliates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'affiliates'
      AND policyname = 'Users can update own affiliate'
  ) THEN
    CREATE POLICY "Users can update own affiliate"
    ON public.affiliates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
