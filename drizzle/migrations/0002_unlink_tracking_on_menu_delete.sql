CREATE OR REPLACE FUNCTION public.unlink_food_tracking_on_menu_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.food_tracking_weeks w
  WHERE w.cardapio_id = OLD.id
    AND w.user_id = OLD.user_id
    AND w.week_start + 6 >= (now() AT TIME ZONE w.timezone)::date;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.unlink_food_tracking_on_menu_delete() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_unlink_food_tracking ON public.cardapios_salvos;
CREATE TRIGGER trg_unlink_food_tracking AFTER DELETE ON public.cardapios_salvos
FOR EACH ROW EXECUTE FUNCTION public.unlink_food_tracking_on_menu_delete();