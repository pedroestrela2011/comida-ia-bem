import { useMemo } from "react";
import { useGamification } from "@/hooks/useGamification";
import { ACHIEVEMENTS, CATEGORY_LABELS, AchievementCategory } from "@/data/achievements";
import { getLevel, getProgress, LEVELS, getLevelIndex } from "@/lib/levels";
import { AchievementCard } from "@/components/dashboard/RarityBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Shield, Sparkles, Trophy, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Jornada() {
  const { enabled, xp, unlocked, loading } = useGamification();

  const stats = useMemo(() => {
    const count = (cat: AchievementCategory) => ACHIEVEMENTS.filter(a => a.category === cat).length;
    const unlockedCount = (cat: AchievementCategory) =>
      ACHIEVEMENTS.filter(a => a.category === cat && unlocked.has(a.key)).length;
    return { count, unlockedCount };
  }, [unlocked]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!enabled) {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-4">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-bold">Jornada de Evolução desativada</h1>
        <p className="text-sm text-muted-foreground">
          Ative o sistema em Configurações para começar a acumular XP e desbloquear conquistas.
        </p>
        <Button asChild>
          <Link to="/dashboard/configuracoes">Ir para Configurações</Link>
        </Button>
      </div>
    );
  }

  const totalXP = xp?.total_xp ?? 0;
  const level = getLevel(totalXP);
  const progress = getProgress(totalXP);
  const totalAchievements = ACHIEVEMENTS.length;
  const totalUnlocked = unlocked.size;
  const overallPct = Math.round((totalUnlocked / totalAchievements) * 100);

  const categories: AchievementCategory[] = ["alimentacao","streak","receitas","analisador","esporte","progresso","pdf","surpresa"];

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-8">
      {/* Nível */}
      <Card className="border-2 border-primary/30 overflow-hidden">
        <CardContent className="pt-6 pb-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{level.icon}</div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nível atual</p>
              <h2 className="text-2xl font-bold text-foreground">{level.name}</h2>
              <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP</p>
            </div>
          </div>
          {progress.nextName ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso até {progress.nextName}</span>
                <span>{progress.toNext.toLocaleString()} XP restantes</span>
              </div>
              <Progress value={progress.pct} className="h-2.5" />
            </div>
          ) : (
            <p className="text-xs text-center text-amber-600 font-semibold">Nível máximo alcançado ⚡</p>
          )}
        </CardContent>
      </Card>

      {/* Sequência + Escudo */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 text-center space-y-1">
            <Flame className="h-6 w-6 text-orange-500 mx-auto" />
            <p className="text-3xl font-bold text-foreground">{xp?.current_streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
            <p className="text-[10px] text-muted-foreground">Recorde: {xp?.longest_streak ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center space-y-1">
            <Shield className={`h-6 w-6 mx-auto ${xp?.streak_shield_available ? "text-amber-500" : "text-muted-foreground/40"}`} />
            <p className="text-sm font-semibold text-foreground">{xp?.streak_shield_available ? "Protetor disponível" : "Sem protetor"}</p>
            <p className="text-[10px] text-muted-foreground">Protege 1 falha por mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Conquistas ({totalUnlocked}/{totalAchievements})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={overallPct} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{overallPct}% completo</p>
        </CardContent>
      </Card>

      {/* Categorias */}
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter(a => a.category === cat);
        if (items.length === 0) return null;
        return (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {cat === "surpresa" && <Sparkles className="h-4 w-4 text-primary" />}
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {stats.unlockedCount(cat)}/{stats.count(cat)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((a) => (
                  <AchievementCard
                    key={a.key}
                    icon={a.icon}
                    title={a.title}
                    description={a.description}
                    rarity={a.rarity}
                    unlocked={unlocked.has(a.key)}
                    secret={a.secret}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
