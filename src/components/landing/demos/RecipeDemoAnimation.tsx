import { motion } from "framer-motion";
import { ChefHat, Clock, Flame } from "lucide-react";
import DemoShell from "./DemoShell";
import { useDemoStep } from "./useDemoStep";

const ingredients = ["Ovos", "Espinafre", "Tomate", "Queijo branco"];

const RecipeDemoAnimation = () => {
  const step = useDemoStep(7, 5);
  const done = step >= 5;

  return (
    <DemoShell icon={ChefHat} title="Receita com o que tem" done={done} loadingLabel="Combinando" doneLabel="Pronto" progress={step / 5}>
      <p className="text-[10px] text-muted-foreground mb-1.5">Ingredientes em casa</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {ingredients.map((ing, i) => {
          const on = step > i;
          return (
            <motion.span
              key={ing}
              initial={false}
              animate={{ scale: on ? 1 : 0.95, opacity: on ? 1 : 0.4 }}
              className={`text-[10px] font-medium rounded-full px-2 py-0.5 border transition-colors ${
                on ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {ing}
            </motion.span>
          );
        })}
      </div>
      <motion.div
        initial={false}
        animate={{ opacity: done ? 1 : 0.35, y: done ? 0 : 6 }}
        transition={{ duration: 0.35 }}
        className="rounded-lg bg-muted/60 p-2"
      >
        {done ? (
          <>
            <p className="text-[11px] font-semibold text-foreground">Omelete mediterrânea</p>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 12 min</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> 310 kcal</span>
              <span>4 passos</span>
            </div>
          </>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/20 animate-pulse" />
            <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20 animate-pulse" />
          </div>
        )}
      </motion.div>
    </DemoShell>
  );
};

export default RecipeDemoAnimation;
