
ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

GRANT UPDATE ON public.login_attempts TO authenticated;

DROP POLICY IF EXISTS "Admins can update login attempts" ON public.login_attempts;
CREATE POLICY "Admins can update login attempts"
ON public.login_attempts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
