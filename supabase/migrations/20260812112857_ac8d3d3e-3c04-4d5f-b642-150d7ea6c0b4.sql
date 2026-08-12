CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.promo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL,
  telegram_username text,
  player_id text NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  promo_code text NOT NULL UNIQUE,
  personal_url text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  email_sent boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX promo_requests_telegram_user_id_key ON public.promo_requests (telegram_user_id);
CREATE INDEX promo_requests_player_id_idx ON public.promo_requests (player_id);
CREATE INDEX promo_requests_email_idx ON public.promo_requests (lower(email));

GRANT SELECT, UPDATE ON public.promo_requests TO authenticated;
GRANT ALL ON public.promo_requests TO service_role;
ALTER TABLE public.promo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view promo requests" ON public.promo_requests
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo requests" ON public.promo_requests
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bot_sessions (
  telegram_user_id bigint PRIMARY KEY,
  step text NOT NULL DEFAULT 'idle',
  draft_player_id text,
  draft_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_sessions TO service_role;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_promo_requests_updated_at BEFORE UPDATE ON public.promo_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_sessions_updated_at BEFORE UPDATE ON public.bot_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();