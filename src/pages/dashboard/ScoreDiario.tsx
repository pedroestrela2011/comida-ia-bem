import { useDailyScore } from "@/hooks/useDailyScore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Zap, UtensilsCrossed, TrendingUp, Dumbbell, Target } from "lucide-react";

const actionItems = [
  { key: "cardapio", label: "Cardápio do dia", max: 40, icon: UtensilsCrossed, color: "text-green-500" },
  { key: "progresso", label: "Registro de progresso", max: 20, icon: TrendingUp, color: "text-blue-500" },
  { key: "analisador", label: "Analisador de prato", max: 15, icon: Target, color: "text-purple-500" },
  { key: "exercicio", label: "Atividade física", max: 15, icon: Dumbbell, color: "text-orange-500" },
  { key: "consistencia", label: "Consistência diária", max: 10, icon: Flame, color: "text-red-500" },
];

export default function ScoreDiario() {
  const { score, loading, history, level, message } = useDailyScore();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  const scoreColor =
    score.total_score >= 80 ? "text-green-500" :
    score.total_score >= 50 ? "text-yellow-500" :
    "text-red-400";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Score Diário</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu desempenho e mantenha a consistência</p>
      </div>

      {/* Main Score Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 pb-4 text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColor}`}>{score.total_score}</span>
            </div>
            <span className="absolute -bottom-1 text-xs text-muted-foreground font-medium bg-background px-2">/100</span>
          </div>
          <Progress value={score.total_score} className="h-3 max-w-xs mx-auto" />
          <p className="text-sm text-muted-foreground italic">{message}</p>
        </CardContent>
      </Card>

      {/* Streak & Level */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{score.streak}</p>
            <p className="text-xs text-muted-foreground">dias seguidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Trophy className={`h-6 w-6 mx-auto mb-1 ${level.color}`} />
            <p className="text-lg font-bold text-foreground">{level.icon} {level.label}</p>
            <p className="text-xs text-muted-foreground">seu nível</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.map((item) => {
            const pts = score[`${item.key}_points` as keyof typeof score] as number;
            return (
              <div key={item.key} className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground truncate">{item.label}</span>
                    <span className="font-semibold text-foreground">+{pts}</span>
                  </div>
                  <Progress value={(pts / item.max) * 100} className="h-1.5 mt-1" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">/{item.max}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* History (last 7 days) */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 justify-between h-24">
              {history.map((day) => {
                const height = Math.max((day.total_score / 100) * 80, 4);
                const dayLabel = new Date(day.score_date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
                return (
                  <div key={day.score_date} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{day.total_score}</span>
                    <div
                      className={`w-full max-w-[28px] rounded-t ${day.total_score >= 60 ? "bg-primary" : "bg-muted-foreground/30"}`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level progression */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { icon: "🥉", label: "Iniciante", min: 0 },
              { icon: "🥈", label: "Consistente", min: 7 },
              { icon: "🥇", label: "Focado", min: 14 },
              { icon: "👑", label: "Elite", min: 30 },
            ].map((lvl) => (
              <div
                key={lvl.label}
                className={`p-2 rounded-lg border text-xs ${
                  score.streak >= lvl.min ? "border-primary bg-primary/10 font-semibold" : "border-border opacity-50"
                }`}
              >
                <div className="text-lg">{lvl.icon}</div>
                <div className="text-foreground mt-1">{lvl.label}</div>
                <div className="text-muted-foreground text-[10px]">{lvl.min}+ dias</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
