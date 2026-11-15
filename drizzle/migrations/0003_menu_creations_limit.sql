CREATE TABLE public.menu_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'criar',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_creations_user_idx ON public.menu_creations(user_id, created_at);
GRANT SELECT ON public.menu_creations TO authenticated;
GRANT ALL ON public.menu_creations TO service_role;
ALTER TABLE public.menu_creations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own menu creations" ON public.menu_creations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_tracking_snapshot_on_menu_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.dados IS DISTINCT FROM OLD.dados THEN
    UPDATE public.food_tracking_weeks w
      SET cardapio_snapshot = NEW.dados
      WHERE w.cardapio_id = NEW.id AND w.user_id = NEW.user_id
        AND w.week_start = (date_trunc('week', (now() AT TIME ZONE w.timezone)))::date;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sync_tracking_snapshot_on_menu_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_tracking_snapshot_on_menu_update AFTER UPDATE ON public.cardapios_salvos
FOR EACH ROW EXECUTE FUNCTION public.sync_tracking_snapshot_on_menu_update();