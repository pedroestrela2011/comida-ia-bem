import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDailyScore } from "@/hooks/useDailyScore";
import {
  Flame,
  Trophy,
  CalendarDays,
  TrendingUp,
  UtensilsCrossed,
  Dumbbell,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Bell,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_DETAILS = [
  {
    key: "cardapio" as const,
    label: "Cardápio do dia",
    maxPoints: 40,
    icon: CalendarDays,
    description: "Completar 70%+ das refeições",
  },
  {
    key: "progresso" as const,
    label: "Registrar progresso",
    maxPoints: 20,
    icon: TrendingUp,
    description: "Registrar peso ou medidas",
  },
  {
    key: "analisador" as const,
    label: "Analisador de prato",
    maxPoints: 15,
    icon: UtensilsCrossed,
    description: "Completar uma análise",
  },
  {
    key: "exercicio" as const,
    label: "Atividade física",
    maxPoints: 15,
    icon: Dumbbell,
    description: "Registrar exercício no Modo Esporte",
  },
];

export default function ScoreDiario() {
  const { score, loading, streakDays, getLevel, getReminder, hasAction } = useDailyScore();
  const level = getLevel();
  const reminder = getReminder();

  const scoreColor = () => {
    if (score.total_score >= 80) return "text-primary";
    if (score.total_score >= 60) return "text-accent";
    if (score.total_score >= 30) return "text-yellow-500";
    return "text-destructive";
  };

  const progressColor = () => {
    if (score.total_score >= 80) return "bg-primary";
    if (score.total_score >= 60) return "bg-accent";
    if (score.total_score >= 30) return "bg-yellow-500";
    return "bg-destructive";
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Target className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Score Diário
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua pontuação e mantenha hábitos saudáveis.
        </p>
      </div>

      {/* Main Score Card */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            {/* Score circle */}
            <div className="relative flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-muted flex items-center justify-center bg-card">
                <div className="text-center">
                  <span className={`text-4xl font-bold ${scoreColor()}`}>
                    {score.total_score}
                  </span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso do dia</span>
                <span>{score.total_score}%</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor()}`}
                  style={{ width: `${score.total_score}%` }}
                />
              </div>
            </div>

            {/* Level & Streak row */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <Badge variant="secondary" className="text-sm gap-1 px-3 py-1">
                <span>{level.icon}</span>
                {level.label}
              </Badge>
              {streakDays > 0 && (
                <Badge variant="outline" className="text-sm gap-1 px-3 py-1 border-primary/30">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  {streakDays} {streakDays === 1 ? "dia" : "dias"} seguidos
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4 flex items-start gap-3">
          <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">{reminder}</p>
        </CardContent>
      </Card>

      {/* Points Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Detalhamento
          </CardTitle>
          <CardDescription>Pontos conquistados hoje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACTION_DETAILS.map((action) => {
            const earned = score[`${action.key}_points` as keyof typeof score] as number;
            const done = hasAction(action.key);

            return (
              <div
                key={action.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  done ? "bg-primary/5 border border-primary/20" : "bg-muted/40"
                }`}
              >
                <div className={`p-2 rounded-lg ${done ? "bg-primary/10" : "bg-muted"}`}>
                  <action.icon className={`h-4 w-4 ${done ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {action.label}
                    </span>
                    <span className={`text-sm font-bold ${done ? "text-primary" : "text-muted-foreground"}`}>
                      +{earned}/{action.maxPoints}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted shrink-0" />
                )}
              </div>
            );
          })}

          {/* Consistência bonus */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              score.consistencia_points > 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/40"
            }`}
          >
            <div className={`p-2 rounded-lg ${score.consistencia_points > 0 ? "bg-primary/10" : "bg-muted"}`}>
              <Zap className={`h-4 w-4 ${score.consistencia_points > 0 ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${score.consistencia_points > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  Bônus de consistência
                </span>
                <span className={`text-sm font-bold ${score.consistencia_points > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  +{score.consistencia_points}/10
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Realize 2+ ações diferentes</p>
            </div>
            {score.consistencia_points > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Levels System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sistema de Níveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🥉", label: "Iniciante", req: "0+ dias", active: streakDays < 7 },
              { icon: "🥈", label: "Consistente", req: "7+ dias", active: streakDays >= 7 && streakDays < 14 },
              { icon: "🥇", label: "Focado", req: "14+ dias", active: streakDays >= 14 && streakDays < 30 },
              { icon: "👑", label: "Elite Saudável", req: "30+ dias", active: streakDays >= 30 },
            ].map((lvl) => (
              <div
                key={lvl.label}
                className={`p-3 rounded-lg text-center border transition-colors ${
                  lvl.active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <span className="text-2xl">{lvl.icon}</span>
                <p className={`text-sm font-medium mt-1 ${lvl.active ? "text-foreground" : "text-muted-foreground"}`}>
                  {lvl.label}
                </p>
                <p className="text-xs text-muted-foreground">{lvl.req}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
