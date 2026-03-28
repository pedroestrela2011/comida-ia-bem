import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActionType = "cardapio" | "progresso" | "analisador" | "exercicio";

interface DailyScore {
  total_score: number;
  cardapio_points: number;
  progresso_points: number;
  analisador_points: number;
  exercicio_points: number;
  consistencia_points: number;
  streak_count: number;
}

interface DailyAction {
  action_type: ActionType;
  points: number;
  created_at: string;
}

const POINTS_MAP: Record<ActionType, number> = {
  cardapio: 40,
  progresso: 20,
  analisador: 15,
  exercicio: 15,
};

const DEFAULT_SCORE: DailyScore = {
  total_score: 0,
  cardapio_points: 0,
  progresso_points: 0,
  analisador_points: 0,
  exercicio_points: 0,
  consistencia_points: 0,
  streak_count: 0,
};

export function useDailyScore() {
  const [score, setScore] = useState<DailyScore>(DEFAULT_SCORE);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const fetchScore = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch today's score
      const { data: scoreData } = await supabase
        .from("daily_scores")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("score_date", today)
        .maybeSingle();

      if (scoreData) {
        setScore({
          total_score: scoreData.total_score,
          cardapio_points: scoreData.cardapio_points,
          progresso_points: scoreData.progresso_points,
          analisador_points: scoreData.analisador_points,
          exercicio_points: scoreData.exercicio_points,
          consistencia_points: scoreData.consistencia_points,
          streak_count: scoreData.streak_count,
        });
        setStreakDays(scoreData.streak_count);
      } else {
        setScore(DEFAULT_SCORE);
      }

      // Fetch today's actions
      const { data: actionsData } = await supabase
        .from("daily_actions")
        .select("action_type, points, created_at")
        .eq("user_id", session.user.id)
        .eq("action_date", today);

      setActions((actionsData as DailyAction[]) || []);
    } catch (e) {
      console.error("Error fetching score:", e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  const calculateStreak = useCallback(async (userId: string): Promise<number> => {
    const { data } = await supabase
      .from("daily_scores")
      .select("score_date, total_score")
      .eq("user_id", userId)
      .gte("total_score", 60)
      .order("score_date", { ascending: false })
      .limit(60);

    if (!data || data.length === 0) return 0;

    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      
      // Skip today if no score yet (still in progress)
      if (i === 0 && !data.find(d => d.score_date === dateStr)) continue;
      
      if (data.find(d => d.score_date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const registerAction = useCallback(async (actionType: ActionType, metadata: Record<string, unknown> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const userId = session.user.id;
      const points = POINTS_MAP[actionType];

      // Try to insert (upsert) the action - unique constraint prevents duplicates
      const { error: actionError } = await supabase
        .from("daily_actions")
        .upsert(
          {
            user_id: userId,
            action_date: today,
            action_type: actionType,
            points,
            metadata,
          },
          { onConflict: "user_id,action_date,action_type", ignoreDuplicates: true }
        );

      if (actionError) {
        console.error("Error registering action:", actionError);
        return false;
      }

      // Recalculate today's score
      const { data: todayActions } = await supabase
        .from("daily_actions")
        .select("action_type, points")
        .eq("user_id", userId)
        .eq("action_date", today);

      const actionPoints = (todayActions || []).reduce((sum, a) => sum + a.points, 0);
      const actionTypes = new Set((todayActions || []).map(a => a.action_type));
      const consistencia = actionTypes.size >= 2 ? 10 : 0;
      const totalScore = Math.min(actionPoints + consistencia, 100);

      const streak = await calculateStreak(userId);

      const scorePayload = {
        user_id: userId,
        score_date: today,
        total_score: totalScore,
        cardapio_points: (todayActions || []).find(a => a.action_type === "cardapio")?.points || 0,
        progresso_points: (todayActions || []).find(a => a.action_type === "progresso")?.points || 0,
        analisador_points: (todayActions || []).find(a => a.action_type === "analisador")?.points || 0,
        exercicio_points: (todayActions || []).find(a => a.action_type === "exercicio")?.points || 0,
        consistencia_points: consistencia,
        streak_count: streak,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("daily_scores")
        .upsert(scorePayload, { onConflict: "user_id,score_date" });

      await fetchScore();
      return true;
    } catch (e) {
      console.error("Error registering action:", e);
      return false;
    }
  }, [today, fetchScore, calculateStreak]);

  const getLevel = useCallback(() => {
    if (streakDays >= 30) return { label: "Elite Saudável", icon: "👑", color: "text-yellow-500" };
    if (streakDays >= 14) return { label: "Focado", icon: "🥇", color: "text-yellow-400" };
    if (streakDays >= 7) return { label: "Consistente", icon: "🥈", color: "text-gray-400" };
    return { label: "Iniciante", icon: "🥉", color: "text-amber-700" };
  }, [streakDays]);

  const getReminder = useCallback(() => {
    const { total_score } = score;
    if (total_score === 0) return "Comece a registrar suas atividades para ganhar pontos hoje!";
    if (total_score < 60) return "Você ainda pode melhorar seu score hoje. Não perca sua sequência!";
    if (total_score >= 60 && total_score < 100) return "Ótimo progresso! Complete mais ações para atingir 100.";
    return `Parabéns! Score perfeito hoje! 🎉`;
  }, [score]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    score,
    actions,
    loading,
    streakDays,
    registerAction,
    getLevel,
    getReminder,
    fetchScore,
    hasAction: (type: ActionType) => actions.some(a => a.action_type === type),
  };
}
