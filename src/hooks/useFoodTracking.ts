import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, DayRecord, MealLog, MenuSnapshot, todayInTz, weekStartOf } from "@/lib/food-tracking";

export interface TrackingWeek {
  id: string;
  week_start: string;
  cardapio_snapshot: MenuSnapshot;
  timezone: string;
}

const defaultTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";

export function useFoodTracking() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [week, setWeek] = useState<TrackingWeek | null>(null);
  const [prevWeek, setPrevWeek] = useState<TrackingWeek | null>(null);
  const [days, setDays] = useState<DayRecord[]>([]);
  const [prevDays, setPrevDays] = useState<DayRecord[]>([]);
  const [tz, setTz] = useState(defaultTz());

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const browserTz = defaultTz();
    const thisStart = weekStartOf(todayInTz(browserTz));
    const lastStart = addDays(thisStart, -7);
    const { data: weeks } = await supabase.from("food_tracking_weeks")
      .select("id, week_start, cardapio_snapshot, timezone")
      .eq("user_id", user.id).in("week_start", [thisStart, lastStart]);
    const cur = (weeks || []).find((w) => w.week_start === thisStart) as TrackingWeek | undefined;
    const prev = (weeks || []).find((w) => w.week_start === lastStart) as TrackingWeek | undefined;
    const ids = [cur?.id, prev?.id].filter(Boolean) as string[];
    let rows: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("food_tracking_days")
        .select("week_id, day_date, meals, finalized").in("week_id", ids);
      rows = data || [];
    }
    setWeek(cur || null);
    setPrevWeek(prev || null);
    setTz(cur?.timezone || browserTz);
    setDays(rows.filter((r) => r.week_id === cur?.id) as DayRecord[]);
    setPrevDays(rows.filter((r) => r.week_id === prev?.id) as DayRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const linkMenu = async (cardapioId: string, snapshot: MenuSnapshot) => {
    if (!userId) return { error: "Sessão expirada" };
    const t = defaultTz();
    const { error } = await supabase.from("food_tracking_weeks").insert({
      user_id: userId, week_start: weekStartOf(todayInTz(t)), cardapio_id: cardapioId,
      cardapio_snapshot: snapshot as any, timezone: t,
    });
    if (error) return { error: error.code === "23505" ? "Esta semana já tem um cardápio vinculado." : error.message };
    await load();
    return {};
  };

  const saveDay = async (date: string, meals: Record<string, MealLog>, finalize = false) => {
    if (!userId || !week) return { error: "Nenhuma semana vinculada" };
    const existing = days.find((d) => d.day_date === date);
    if (existing?.finalized) return { error: "Este dia já foi finalizado." };
    const payload = { meals: meals as any, finalized: finalize };
    const res = existing
      ? await supabase.from("food_tracking_days").update(payload).eq("week_id", week.id).eq("day_date", date)
      : await supabase.from("food_tracking_days").insert({ ...payload, user_id: userId, week_id: week.id, day_date: date });
    if (res.error) return { error: res.error.message.includes("finalizado") ? "Este dia já foi finalizado." : res.error.message };
    await load();
    return {};
  };

  const uploadPhoto = async (file: File) => {
    if (!userId) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("meal-photos").upload(path, file);
    return error ? null : path;
  };

  return { loading, week, prevWeek, days, prevDays, tz, linkMenu, saveDay, uploadPhoto, reload: load };
}
