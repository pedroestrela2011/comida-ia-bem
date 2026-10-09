import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Check, Loader2, Sparkles } from "lucide-react";

const days = [
  { day: "Seg", meal: "Omelete com aveia e frutas", kcal: 420 },
  { day: "Ter", meal: "Frango grelhado com legumes", kcal: 610 },
  { day: "Qua", meal: "Salmão com quinoa", kcal: 580 },
  { day: "Qui", meal: "Bowl de grão-de-bico", kcal: 540 },
];

// 0 = gerando, 1..4 = dias aparecendo, 5-6 = pausa com resultado pronto
const TOTAL_STEPS = 7;
const STEP_MS = 1000;

const MealPlannerDemoAnimation = () => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(reduceMotion ? 5 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setStep((s) => (s + 1) % TOTAL_STEPS), STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const done = step >= 5;
  const progress = Math.min(step / 5, 1);

  return (
    <div
      className="relative w-full max-w-[300px] rounded-xl bg-card/95 backdrop-blur shadow-lg border border-border p-3"
      aria-hidden="true"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          Cardápio da semana
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={done ? "done" : "loading"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${
              done ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            {done ? (
              <>
                <Check className="w-3 h-3" /> Pronto
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Gerando
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Barra de progresso */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-2.5">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Dias */}
      <div className="space-y-1.5">
        {days.map((item, i) => {
          const visible = step > i;
          return (
            <motion.div
              key={item.day}
              initial={false}
              animate={{
                opacity: visible ? 1 : 0.35,
                x: visible ? 0 : -6,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1.5 min-h-[30px]"
            >
              <span
                className={`w-8 shrink-0 text-center text-[10px] font-bold rounded-md py-0.5 transition-colors ${
                  visible ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {item.day}
              </span>
              {visible ? (
                <>
                  <span className="flex-1 truncate text-[11px] text-foreground">{item.meal}</span>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {item.kcal} kcal
                  </span>
                </>
              ) : (
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/20 animate-pulse" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Rodapé */}
      <motion.div
        initial={false}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="mt-2 flex items-center justify-center gap-1 text-[10px] text-primary font-medium"
      >
        <Sparkles className="w-3 h-3" />
        Lista de compras gerada automaticamente
      </motion.div>
    </div>
  );
};

export default MealPlannerDemoAnimation;
