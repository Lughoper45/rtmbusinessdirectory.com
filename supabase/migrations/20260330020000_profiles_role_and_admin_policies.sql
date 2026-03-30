ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('member', 'business', 'admin'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  )
);
