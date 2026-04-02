import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDailyScore } from "./useDailyScore";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "score" | "acao";
  condition: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  streak: number;
  totalAccumulated: number;
  totalCardapios: number;
  totalAnalises: number;
  totalProgressos: number;
  totalExercicios: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Streak-based
  { key: "streak_3", title: "Primeiros Passos", description: "3 dias consecutivos", icon: "🔥", category: "streak", condition: (c) => c.streak >= 3 },
  { key: "streak_7", title: "Uma Semana Forte", description: "7 dias consecutivos", icon: "💪", category: "streak", condition: (c) => c.streak >= 7 },
  { key: "streak_14", title: "Duas Semanas", description: "14 dias consecutivos", icon: "⚡", category: "streak", condition: (c) => c.streak >= 14 },
  { key: "streak_30", title: "Mês de Ouro", description: "30 dias consecutivos", icon: "👑", category: "streak", condition: (c) => c.streak >= 30 },
  { key: "streak_60", title: "Inabalável", description: "60 dias consecutivos", icon: "💎", category: "streak", condition: (c) => c.streak >= 60 },
  { key: "streak_90", title: "Lenda Fitness", description: "90 dias consecutivos", icon: "🏆", category: "streak", condition: (c) => c.streak >= 90 },

  // Accumulated score
  { key: "score_100", title: "Centenário", description: "100 pontos acumulados", icon: "⭐", category: "score", condition: (c) => c.totalAccumulated >= 100 },
  { key: "score_500", title: "Meio Milhar", description: "500 pontos acumulados", icon: "🌟", category: "score", condition: (c) => c.totalAccumulated >= 500 },
  { key: "score_1000", title: "Mil Pontos", description: "1.000 pontos acumulados", icon: "🎯", category: "score", condition: (c) => c.totalAccumulated >= 1000 },
  { key: "score_2500", title: "Expert Nutri", description: "2.500 pontos acumulados", icon: "🧠", category: "score", condition: (c) => c.totalAccumulated >= 2500 },
  { key: "score_5000", title: "Mestre da Saúde", description: "5.000 pontos acumulados", icon: "🏅", category: "score", condition: (c) => c.totalAccumulated >= 5000 },

  // Action-based
  { key: "first_cardapio", title: "Primeiro Cardápio", description: "Gere seu primeiro cardápio", icon: "🍽️", category: "acao", condition: (c) => c.totalCardapios >= 1 },
  { key: "cardapios_10", title: "Chef de Cozinha", description: "10 cardápios gerados", icon: "👨‍🍳", category: "acao", condition: (c) => c.totalCardapios >= 10 },
  { key: "first_analise", title: "Olho Clínico", description: "Primeira análise de prato", icon: "🔍", category: "acao", condition: (c) => c.totalAnalises >= 1 },
  { key: "analises_10", title: "Analista Pro", description: "10 análises de prato", icon: "🧪", category: "acao", condition: (c) => c.totalAnalises >= 10 },
  { key: "first_progresso", title: "Registro Inicial", description: "Primeiro registro de progresso", icon: "📊", category: "acao", condition: (c) => c.totalProgressos >= 1 },
  { key: "exercicios_5", title: "Atleta em Formação", description: "5 atividades físicas", icon: "🏃", category: "acao", condition: (c) => c.totalExercicios >= 5 },
];

export function useAchievements() {
  const { score } = useDailyScore();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAndUnlock = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch already unlocked
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("achievement_key")
      .eq("user_id", user.id);

    const alreadyUnlocked = new Set((existing || []).map((e: any) => e.achievement_key));

    // Build context
    const { data: scores } = await supabase
      .from("daily_scores")
      .select("total_score, streak")
      .eq("user_id", user.id);

    const totalAccumulated = (scores || []).reduce((sum: number, s: any) => sum + s.total_score, 0);
    const maxStreak = Math.max(score.streak, ...(scores || []).map((s: any) => s.streak || 0));

    const { data: actions } = await supabase
      .from("daily_actions")
      .select("action_type")
      .eq("user_id", user.id);

    const actionCounts: Record<string, number> = {};
    (actions || []).forEach((a: any) => {
      actionCounts[a.action_type] = (actionCounts[a.action_type] || 0) + 1;
    });

    const ctx: AchievementContext = {
      streak: maxStreak,
      totalAccumulated,
      totalCardapios: actionCounts["cardapio"] || 0,
      totalAnalises: actionCounts["analisador"] || 0,
      totalProgressos: actionCounts["progresso"] || 0,
      totalExercicios: actionCounts["exercicio"] || 0,
    };

    // Check each achievement
    const justUnlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (!alreadyUnlocked.has(ach.key) && ach.condition(ctx)) {
        const { error } = await supabase
          .from("user_achievements")
          .insert({ user_id: user.id, achievement_key: ach.key } as any);
        if (!error) {
          alreadyUnlocked.add(ach.key);
          justUnlocked.push(ach.key);
        }
      }
    }

    setUnlocked(alreadyUnlocked);
    setNewlyUnlocked(justUnlocked);
    setLoading(false);
  }, [score.streak]);

  useEffect(() => {
    checkAndUnlock();
  }, [checkAndUnlock]);

  return {
    achievements: ACHIEVEMENTS,
    unlocked,
    newlyUnlocked,
    loading,
    totalUnlocked: unlocked.size,
    totalAchievements: ACHIEVEMENTS.length,
    refetch: checkAndUnlock,
  };
}
