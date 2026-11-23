import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACHIEVEMENTS, AchievementContext, AchievementDef } from "@/data/achievements";
import { XP_VALUES, XPAction, getLevel } from "@/lib/levels";
import { RARITY_INFO } from "@/lib/rarity";


export type UserXP = {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_action_date: string | null;
  streak_shield_available: boolean;
  shield_month: string | null;
};

export function useGamification() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(true);
  const [xp, setXP] = useState<UserXP | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("gamificacao_ativa, gamificacao_onboarded")
      .eq("user_id", user.id)
      .maybeSingle() as any;

    const isEnabled = !!profile?.gamificacao_ativa;
    setEnabled(isEnabled);
    setOnboarded(!!profile?.gamificacao_onboarded);

    if (!isEnabled) { setLoading(false); return; }

    const { data: xpRow, error: xpError } = await supabase.rpc("ensure_user_xp");
    if (xpError) {
      setXP(null);
      setUnlocked(new Set());
      setLoading(false);
      return;
    }
    setXP(xpRow);

    const { data: achs } = await supabase
      .from("user_achievements")
      .select("achievement_key")
      .eq("user_id", user.id);
    setUnlocked(new Set((achs || []).map((a: any) => a.achievement_key)));

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setEnabledPersist = useCallback(async (value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ gamificacao_ativa: value } as any)
      .eq("user_id", user.id);
    setEnabled(value);
    if (value) await load();
  }, [load]);

  const markOnboarded = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ gamificacao_onboarded: true } as any)
      .eq("user_id", user.id);
    setOnboarded(true);
  }, []);

  const buildContext = useCallback(async (userId: string, currentXP: UserXP): Promise<AchievementContext> => {
    const { data: events } = await supabase
      .from("xp_events" as any)
      .select("action_type, metadata, created_at")
      .eq("user_id", userId) as any;

    const evts = (events || []) as any[];
    const [{ data: ftWeeks }, { data: ftDays }] = await Promise.all([
      supabase.from("food_tracking_weeks").select("id").eq("user_id", userId),
      supabase.from("food_tracking_days").select("week_id, meals, finalized").eq("user_id", userId),
    ]);
    const fd = (ftDays || []) as any[];
    const finalizedByWeek: Record<string, number> = {};
    fd.forEach((d) => { if (d.finalized) finalizedByWeek[d.week_id] = (finalizedByWeek[d.week_id] || 0) + 1; });
    const count = (t: string) => evts.filter(e => e.action_type === t).length;

    const featuresUsed = new Set<string>();
    let earlyMorningCardapio = false;
    evts.forEach(e => {
      featuresUsed.add(e.action_type);
      if (e.action_type === "cardapio") {
        const h = new Date(e.created_at).getHours();
        if (h < 7) earlyMorningCardapio = true;
      }
    });

    return {
      totalXP: currentXP.total_xp,
      currentStreak: currentXP.current_streak,
      longestStreak: currentXP.longest_streak,
      mealsCompleted: count("meal_completed"),
      perfectDays: 0,
      perfectDaysStreak: 0,
      cardapios: count("cardapio"),
      analises: count("analisador"),
      receitas: count("receita"),
      esporte: count("esporte"),
      progressos: count("progresso"),
      pdfs: count("pdf"),
      featuresUsed,
      weekendStreakWeeks: 0,
      earlyMorningCardapio,
      everLostStreak: !!(evts as any).find((e: any) => e.metadata?.streak_lost),
      reachedMaxLevel: currentXP.total_xp >= 10000,
      acompSemanas: (ftWeeks || []).length,
      acompDiasFinalizados: fd.filter((d) => d.finalized).length,
      acompSubstituicoes: fd.reduce((n, d) => n + Object.values(d.meals || {}).filter((m: any) => m?.status === "substituida").length, 0),
      acompSemanasCompletas: Object.values(finalizedByWeek).filter((n) => n >= 7).length,
    };
  }, []);

  const checkAchievements = useCallback(async (userId: string, currentXP: UserXP, already: Set<string>) => {
    const ctx = await buildContext(userId, currentXP);
    const newly: AchievementDef[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!already.has(a.key) && a.condition(ctx)) {
        const { error } = await supabase
          .from("user_achievements")
          .insert({ user_id: userId, achievement_key: a.key } as any);
        if (!error) {
          already.add(a.key);
          newly.push(a);
        }
      }
    }
    setUnlocked(new Set(already));
    // Toasts
    newly.forEach(a => {
      const info = RARITY_INFO[a.rarity];
      toast(`${a.icon}  ${a.title}`, {
        description: `Nova conquista desbloqueada! · ${info.label}`,
        duration: 4000,
        style: { borderLeft: `4px solid ${info.color}` },
      });
    });
  }, [buildContext]);

  const awardXP = useCallback(async (action: XPAction, metadata: Record<string, any> = {}) => {
    if (!enabled) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = xp;
    const { data: updated, error } = await supabase.rpc("award_xp", {
      p_action: action,
      p_metadata: metadata,
    });
    if (error || !updated) return;

    setXP(updated);
    const bonus = current
      ? updated.total_xp - current.total_xp - XP_VALUES[action]
      : 0;
    if (bonus > 0) {
      toast(`+${bonus} XP bônus de sequência!`, { duration: 3500 });
    }

    if (current) {
      const prevLevel = getLevel(current.total_xp);
      const nextLevel = getLevel(updated.total_xp);
      if (prevLevel.name !== nextLevel.name) {
        toast(`${nextLevel.icon}  Novo nível: ${nextLevel.name}!`, { duration: 5000 });
      }
    }

    await checkAchievements(user.id, updated, unlocked);
  }, [enabled, xp, unlocked, checkAchievements]);

  return {
    enabled,
    onboarded,
    xp,
    unlocked,
    loading,
    awardXP,
    setEnabled: setEnabledPersist,
    markOnboarded,
    reload: load,
  };
}
