import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import DemoShell from "./DemoShell";
import { useDemoStep } from "./useDemoStep";

const bars = [
  { d: "S", v: 0.55 },
  { d: "T", v: 0.7 },
  { d: "Q", v: 0.62 },
  { d: "Q", v: 0.8 },
  { d: "S", v: 0.88 },
  { d: "S", v: 0.75 },
  { d: "D", v: 0.95 },
];

const ProgressDemoAnimation = () => {
  const step = useDemoStep(10, 8, 700);
  const done = step >= 8;

  return (
    <DemoShell icon={TrendingUp} title="Sua evolução" done={done} loadingLabel="Atualizando" doneLabel="Meta 92%" progress={step / 8}>
      <div className="flex items-end justify-between gap-1.5 h-20 px-1">
        {bars.map((b, i) => {
          const on = step > i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <motion.div
                className={`w-full rounded-t-md ${on ? "bg-primary" : "bg-muted"}`}
                initial={false}
                animate={{ height: on ? `${b.v * 100}%` : "10%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              <span className="text-[9px] text-muted-foreground">{b.d}</span>
            </div>
          );
        })}
      </div>
      <motion.div initial={false} animate={{ opacity: done ? 1 : 0 }} className="mt-2 flex items-center justify-between text-[10px] font-medium text-primary">
        <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> 14 dias seguidos</span>
        <span>Energia +18%</span>
      </motion.div>
    </DemoShell>
  );
};

export default ProgressDemoAnimation;
