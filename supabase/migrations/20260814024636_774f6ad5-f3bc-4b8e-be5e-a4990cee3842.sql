DELETE FROM public.promo_requests a
USING public.promo_requests b
WHERE a.telegram_user_id = b.telegram_user_id
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

CREATE UNIQUE INDEX IF NOT EXISTS promo_requests_telegram_user_id_key
  ON public.promo_requests (telegram_user_id);