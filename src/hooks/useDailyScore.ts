import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DailyScoreData {
  total_score: number;
  cardapio_points: number;
  progresso_points: number;
  analisador_points: number;
  exercicio_points: number;
  consistencia_points: number;
  streak: number;
}

const defaultScore: DailyScoreData = {
  total_score: 0,
  cardapio_points: 0,
  progresso_points: 0,
  analisador_points: 0,
  exercicio_points: 0,
  consistencia_points: 0,
  streak: 0,
};

function getLevel(streak: number) {
  if (streak >= 30) return { label: "Elite Saudável", icon: "👑", color: "text-yellow-500" };
  if (streak >= 14) return { label: "Focado", icon: "🥇", color: "text-amber-500" };
  if (streak >= 7) return { label: "Consistente", icon: "🥈", color: "text-slate-400" };
  return { label: "Iniciante", icon: "🥉", color: "text-orange-700" };
}

function getSmartMessage(score: DailyScoreData): string {
  if (score.total_score >= 90) return "Incrível! Você está arrasando hoje! 🎉";
  if (score.total_score >= 60) return "Ótimo progresso! Continue assim! 💪";
  if (score.total_score >= 30) return "Você ainda pode melhorar seu score hoje.";
  if (score.streak > 0) return "Não perca sua sequência! Faltam algumas ações.";
  return "Comece seu dia registrando suas atividades! 🌟";
}

export function useDailyScore() {
  const [score, setScore] = useState<DailyScoreData>(defaultScore);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Array<{ score_date: string; total_score: number; streak: number }>>([]);

  const today = new Date().toISOString().split("T")[0];

  const fetchScore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch today's score
    const { data } = await supabase
      .from("daily_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("score_date", today)
      .maybeSingle();

    if (data) {
      setScore({
        total_score: data.total_score,
        cardapio_points: data.cardapio_points,
        progresso_points: data.progresso_points,
        analisador_points: data.analisador_points,
        exercicio_points: data.exercicio_points,
        consistencia_points: data.consistencia_points,
        streak: data.streak,
      });
    } else {
      // Check yesterday's streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: yesterdayData } = await supabase
        .from("daily_scores")
        .select("streak")
        .eq("user_id", user.id)
        .eq("score_date", yesterday.toISOString().split("T")[0])
        .maybeSingle();

      setScore({ ...defaultScore, streak: yesterdayData?.streak && yesterdayData.streak > 0 ? yesterdayData.streak : 0 });
    }

    // Fetch last 7 days history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: histData } = await supabase
      .from("daily_scores")
      .select("score_date, total_score, streak")
      .eq("user_id", user.id)
      .gte("score_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("score_date", { ascending: true });

    setHistory(histData || []);
    setLoading(false);
  };

  const registerAction = async (actionType: string, points: number, metadata: Record<string, unknown> = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Upsert action (unique per user/type/day)
    const { error: actionError } = await supabase
      .from("daily_actions")
      .upsert(
        [{ user_id: user.id, action_type: actionType, action_date: today, points, metadata }] as any,
        { onConflict: "user_id,action_type,action_date" }
      );

    if (actionError) return false;

    // Recalculate today's score from all actions
    const { data: actions } = await supabase
      .from("daily_actions")
      .select("action_type, points")
      .eq("user_id", user.id)
      .eq("action_date", today);

    const pointsMap: Record<string, number> = {};
    (actions || []).forEach((a: { action_type: string; points: number }) => {
      pointsMap[a.action_type] = a.points;
    });

    const cardapio = pointsMap["cardapio"] || 0;
    const progresso = pointsMap["progresso"] || 0;
    const analisador = pointsMap["analisador"] || 0;
    const exercicio = pointsMap["exercicio"] || 0;

    // Consistency: check if yesterday had >= 60 points
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: yesterdayScore } = await supabase
      .from("daily_scores")
      .select("streak, total_score")
      .eq("user_id", user.id)
      .eq("score_date", yesterday.toISOString().split("T")[0])
      .maybeSingle();

    const prevStreak = yesterdayScore?.streak || 0;
    const subtotal = cardapio + progresso + analisador + exercicio;
    const consistencia = prevStreak > 0 ? 10 : 0;
    const totalScore = Math.min(subtotal + consistencia, 100);
    const newStreak = totalScore >= 60 ? prevStreak + 1 : 0;

    await supabase
      .from("daily_scores")
      .upsert(
        {
          user_id: user.id,
          score_date: today,
          total_score: totalScore,
          cardapio_points: cardapio,
          progresso_points: progresso,
          analisador_points: analisador,
          exercicio_points: exercicio,
          consistencia_points: consistencia,
          streak: newStreak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,score_date" }
      );

    await fetchScore();
    return true;
  };

  useEffect(() => {
    fetchScore();

    // Realtime updates
    const channel = supabase
      .channel("daily-scores-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_scores" }, () => {
        fetchScore();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { score, loading, history, registerAction, refetch: fetchScore, level: getLevel(score.streak), message: getSmartMessage(score) };
}
