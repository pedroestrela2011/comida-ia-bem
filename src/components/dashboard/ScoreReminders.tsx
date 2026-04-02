import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDailyScore } from "@/hooks/useDailyScore";

interface Reminder {
  id: string;
  icon: React.ElementType;
  message: string;
  type: "warning" | "info" | "success";
}

export function ScoreReminders() {
  const { score, loading } = useDailyScore();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("notificacoes_score")
        .eq("user_id", user.id)
        .single();
      setEnabled((data as any)?.notificacoes_score ?? true);
    };
    checkPreference();
  }, []);

  if (loading || enabled === null || !enabled) return null;

  const reminders: Reminder[] = [];

  // Streak about to be lost (has streak but low score today)
  if (score.streak > 0 && score.total_score < 60) {
    reminders.push({
      id: "streak-risk",
      icon: Flame,
      message: `Você tem ${score.streak} dias de sequência! Complete mais ações para não perder seu streak.`,
      type: "warning",
    });
  }

  // No activity yet today
  if (score.total_score === 0) {
    reminders.push({
      id: "no-activity",
      icon: Sparkles,
      message: "Você ainda não registrou nenhuma atividade hoje. Comece agora para ganhar pontos!",
      type: "info",
    });
  }

  // Can still improve
  if (score.total_score > 0 && score.total_score < 80) {
    const missing: string[] = [];
    if (score.cardapio_points === 0) missing.push("cardápio");
    if (score.progresso_points === 0) missing.push("progresso");
    if (score.analisador_points === 0) missing.push("analisador de prato");
    if (score.exercicio_points === 0) missing.push("atividade física");

    if (missing.length > 0) {
      reminders.push({
        id: "improve-score",
        icon: TrendingUp,
        message: `Você pode melhorar seu score! Faltam: ${missing.join(", ")}.`,
        type: "info",
      });
    }
  }

  // Almost losing streak warning (streak > 7 and score < 40)
  if (score.streak >= 7 && score.total_score < 40) {
    reminders.push({
      id: "streak-danger",
      icon: AlertTriangle,
      message: `⚠️ Cuidado! Seu streak de ${score.streak} dias está em risco. Aja agora!`,
      type: "warning",
    });
  }

  const visibleReminders = reminders.filter((r) => !dismissed.has(r.id));
  if (visibleReminders.length === 0) return null;

  const typeStyles = {
    warning: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    info: "border-primary/30 bg-primary/10 text-primary",
    success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  };

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {visibleReminders.map((reminder) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, x: 100, height: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${typeStyles[reminder.type]}`}
          >
            <reminder.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{reminder.message}</span>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(reminder.id))}
              className="shrink-0 rounded-full p-1 hover:bg-foreground/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
