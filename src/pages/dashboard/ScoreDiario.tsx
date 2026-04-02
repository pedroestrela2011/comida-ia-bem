import { useDailyScore } from "@/hooks/useDailyScore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Zap, UtensilsCrossed, TrendingUp, Dumbbell, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const actionItems = [
  { key: "cardapio", label: "Cardápio do dia", max: 40, icon: UtensilsCrossed, color: "text-green-500" },
  { key: "progresso", label: "Registro de progresso", max: 20, icon: TrendingUp, color: "text-blue-500" },
  { key: "analisador", label: "Analisador de prato", max: 15, icon: Target, color: "text-purple-500" },
  { key: "exercicio", label: "Atividade física", max: 15, icon: Dumbbell, color: "text-orange-500" },
  { key: "consistencia", label: "Consistência diária", max: 10, icon: Flame, color: "text-red-500" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

export default function ScoreDiario() {
  const { score, loading, history, level, message } = useDailyScore();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-primary text-lg"
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  const scoreColor =
    score.total_score >= 80 ? "text-green-500" :
    score.total_score >= 50 ? "text-yellow-500" :
    "text-red-400";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item} className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Score Diário</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu desempenho e mantenha a consistência</p>
      </motion.div>

      {/* Main Score Card */}
      <motion.div variants={scaleIn}>
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardContent className="pt-6 pb-4 text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
              >
                <motion.span
                  className={`text-4xl font-bold ${scoreColor}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                >
                  {score.total_score}
                </motion.span>
              </motion.div>
              <span className="absolute -bottom-1 text-xs text-muted-foreground font-medium bg-background px-2">/100</span>
            </div>
            <Progress value={score.total_score} className="h-3 max-w-xs mx-auto" />
            <motion.p
              className="text-sm text-muted-foreground italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {message}
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak & Level */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              </motion.div>
              <p className="text-2xl font-bold text-foreground">{score.streak}</p>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, delay: 0.9, repeat: 2 }}
              >
                <Trophy className={`h-6 w-6 mx-auto mb-1 ${level.color}`} />
              </motion.div>
              <p className="text-lg font-bold text-foreground">{level.icon} {level.label}</p>
              <p className="text-xs text-muted-foreground">seu nível</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Breakdown */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Detalhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.map((ai, index) => {
              const pts = score[`${ai.key}_points` as keyof typeof score] as number;
              return (
                <motion.div
                  key={ai.key}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                >
                  <ai.icon className={`h-4 w-4 shrink-0 ${ai.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground truncate">{ai.label}</span>
                      <motion.span
                        className="font-semibold text-foreground"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.08, type: "spring" }}
                      >
                        +{pts}
                      </motion.span>
                    </div>
                    <Progress value={(pts / ai.max) * 100} className="h-1.5 mt-1" />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">/{ai.max}</span>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* History (last 7 days) */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Últimos 7 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 justify-between h-24">
                  {history.map((day, i) => {
                    const height = Math.max((day.total_score / 100) * 80, 4);
                    const dayLabel = new Date(day.score_date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
                    return (
                      <div key={day.score_date} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[10px] text-muted-foreground font-medium">{day.total_score}</span>
                        <motion.div
                          className={`w-full max-w-[28px] rounded-t ${day.total_score >= 60 ? "bg-primary" : "bg-muted-foreground/30"}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                        />
                        <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level progression */}
      <motion.div variants={item}>
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
              ].map((lvl, i) => (
                <motion.div
                  key={lvl.label}
                  className={`p-2 rounded-lg border text-xs ${
                    score.streak >= lvl.min ? "border-primary bg-primary/10 font-semibold" : "border-border opacity-50"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: score.streak >= lvl.min ? 1 : 0.5, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="text-lg"
                    animate={score.streak >= lvl.min ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ delay: 1 + i * 0.15, duration: 0.4 }}
                  >
                    {lvl.icon}
                  </motion.div>
                  <div className="text-foreground mt-1">{lvl.label}</div>
                  <div className="text-muted-foreground text-[10px]">{lvl.min}+ dias</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
