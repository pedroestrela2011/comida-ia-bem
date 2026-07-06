import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACHIEVEMENTS, AchievementContext, AchievementDef } from "@/data/achievements";
import { XP_VALUES, XPAction, getLevel } from "@/lib/levels";
import { RARITY_INFO } from "@/lib/rarity";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const daysBetween = (a: string, b: string) => Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);

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

    const { data: xpRow } = await supabase
      .from("user_xp" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle() as any;

    if (!xpRow) {
      const { data: created } = await supabase
        .from("user_xp" as any)
        .insert({ user_id: user.id, shield_month: monthKey() } as any)
        .select()
        .single() as any;
      setXP(created);
    } else {
      // reset shield mensal
      if (xpRow.shield_month !== monthKey()) {
        const { data: updated } = await supabase
          .from("user_xp" as any)
          .update({ streak_shield_available: true, shield_month: monthKey() } as any)
          .eq("user_id", user.id)
          .select()
          .single() as any;
        setXP(updated);
      } else {
        setXP(xpRow);
      }
    }

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

    const amount = XP_VALUES[action];
    // update streak
    let current = xp;
    if (!current) {
      const { data } = await supabase.from("user_xp" as any).select("*").eq("user_id", user.id).maybeSingle() as any;
      current = data;
    }
    if (!current) return;

    const today = todayISO();
    let newStreak = current.current_streak;
    let newLongest = current.longest_streak;
    let shieldAvailable = current.streak_shield_available;
    let streakLost = false;
    let bonus = 0;

    if (current.last_action_date !== today) {
      if (current.last_action_date) {
        const diff = daysBetween(current.last_action_date, today);
        if (diff === 1) {
          newStreak += 1;
        } else if (diff > 1) {
          if (shieldAvailable) {
            shieldAvailable = false;
            newStreak += 1;
          } else {
            streakLost = true;
            newStreak = 1;
          }
        }
      } else {
        newStreak = 1;
      }
      newLongest = Math.max(newLongest, newStreak);

      if (newStreak === 7) bonus += XP_VALUES.streak_7_bonus;
      if (newStreak === 30) bonus += XP_VALUES.streak_30_bonus;
    }

    const totalDelta = amount + bonus;
    const newTotal = current.total_xp + totalDelta;

    // log main event
    await supabase.from("xp_events" as any).insert({
      user_id: user.id,
      action_type: action,
      xp_amount: amount,
      metadata: { ...metadata, streak_lost: streakLost || undefined },
    } as any);

    if (bonus > 0) {
      await supabase.from("xp_events" as any).insert({
        user_id: user.id,
        action_type: newStreak === 30 ? "bonus_streak_30" : "bonus_streak_7",
        xp_amount: bonus,
        metadata: { streak: newStreak },
      } as any);
      toast(`+${bonus} XP bônus de sequência!`, { duration: 3500 });
    }

    const { data: updated } = await supabase
      .from("user_xp" as any)
      .update({
        total_xp: newTotal,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_action_date: today,
        streak_shield_available: shieldAvailable,
        shield_month: current.shield_month ?? monthKey(),
      } as any)
      .eq("user_id", user.id)
      .select()
      .single() as any;

    setXP(updated);

    // level up detection
    const prevLevel = getLevel(current.total_xp);
    const nextLevel = getLevel(newTotal);
    if (prevLevel.name !== nextLevel.name) {
      toast(`${nextLevel.icon}  Novo nível: ${nextLevel.name}!`, { duration: 5000 });
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
