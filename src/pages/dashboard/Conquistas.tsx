import { useAchievements, ACHIEVEMENTS, AchievementDef } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
  streak: { label: "Sequência", icon: Flame },
  score: { label: "Pontuação", icon: Star },
  acao: { label: "Ações", icon: Zap },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Conquistas() {
  const { achievements, unlocked, newlyUnlocked, loading, totalUnlocked, totalAchievements } = useAchievements();
  const [celebratingKey, setCelebratingKey] = useState<string | null>(null);

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setCelebratingKey(newlyUnlocked[0]);
      const timer = setTimeout(() => setCelebratingKey(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newlyUnlocked]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-primary text-lg">
          Carregando...
        </motion.div>
      </div>
    );
  }

  const pct = Math.round((totalUnlocked / totalAchievements) * 100);
  const categories = ["streak", "score", "acao"] as const;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-2xl mx-auto">
      {/* Celebration toast */}
      <AnimatePresence>
        {celebratingKey && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm px-6 py-4 shadow-lg text-center"
          >
            <p className="text-2xl mb-1">{ACHIEVEMENTS.find((a) => a.key === celebratingKey)?.icon}</p>
            <p className="font-bold text-foreground">Conquista Desbloqueada!</p>
            <p className="text-sm text-muted-foreground">{ACHIEVEMENTS.find((a) => a.key === celebratingKey)?.title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={item} className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Conquistas</h1>
        <p className="text-sm text-muted-foreground">Desbloqueie badges mantendo consistência e engajamento</p>
      </motion.div>

      {/* Progress overview */}
      <motion.div variants={item}>
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6 pb-4 text-center space-y-3">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/20"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring" as const, stiffness: 100, damping: 15 }}
            >
              <Trophy className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <p className="text-3xl font-bold text-foreground">{totalUnlocked}<span className="text-lg text-muted-foreground">/{totalAchievements}</span></p>
              <p className="text-sm text-muted-foreground">conquistas desbloqueadas</p>
            </div>
            <Progress value={pct} className="h-3 max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground">{pct}% completo</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories */}
      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat);
        const catInfo = categoryLabels[cat];
        const CatIcon = catInfo.icon;

        return (
          <motion.div key={cat} variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CatIcon className="h-4 w-4 text-primary" />
                  {catInfo.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {catAchievements.map((ach) => {
                    const isUnlocked = unlocked.has(ach.key);
                    const isNew = newlyUnlocked.includes(ach.key);
                    return (
                      <motion.div
                        key={ach.key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isNew ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className={`relative flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                          isUnlocked
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-muted/30 opacity-50 grayscale"
                        }`}
                      >
                        <span className="text-2xl mb-1">{ach.icon}</span>
                        <p className="text-xs font-semibold text-foreground leading-tight">{ach.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{ach.description}</p>
                        {isUnlocked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                          >
                            <span className="text-[8px] text-primary-foreground">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
