import { motion } from "framer-motion";
import { Camera, HeartPulse } from "lucide-react";
import DemoShell from "./DemoShell";
import { useDemoStep } from "./useDemoStep";

const foods = [
  { name: "Frango grelhado", kcal: 220 },
  { name: "Quinoa", kcal: 160 },
  { name: "Legumes no vapor", kcal: 100 },
];
const macros = [
  { label: "Proteína", value: "38g", pct: 0.75 },
  { label: "Carbo", value: "42g", pct: 0.6 },
  { label: "Gordura", value: "12g", pct: 0.3 },
];

const PlateAnalyzerDemoAnimation = () => {
  const step = useDemoStep(7, 5);
  const done = step >= 4;

  return (
    <DemoShell icon={Camera} title="Análise do prato" done={done} loadingLabel="Escaneando" doneLabel="Pronto" progress={step / 4}>
      <div className="space-y-1.5">
        {foods.map((f, i) => {
          const visible = step > i;
          return (
            <motion.div
              key={f.name}
              initial={false}
              animate={{ opacity: visible ? 1 : 0.35, x: visible ? 0 : -6 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1.5 min-h-[28px]"
            >
              {visible ? (
                <>
                  <span className="flex-1 truncate text-[11px] text-foreground">{f.name}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{f.kcal} kcal</span>
                </>
              ) : (
                <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/20 animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
      <motion.div initial={false} animate={{ opacity: done ? 1 : 0.3 }} className="mt-2 space-y-1">
        {macros.map((m) => (
          <div key={m.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-12 text-muted-foreground">{m.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: done ? `${m.pct * 100}%` : "0%" }} transition={{ duration: 0.6 }} />
            </div>
            <span className="w-7 text-right font-medium text-foreground">{m.value}</span>
          </div>
        ))}
      </motion.div>
      <motion.div initial={false} animate={{ opacity: done ? 1 : 0 }} className="mt-2 flex items-center justify-between text-[10px] font-medium text-primary">
        <span>Total: 480 kcal</span>
        <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3" /> Saúde 9,5/10</span>
      </motion.div>
    </DemoShell>
  );
};

export default PlateAnalyzerDemoAnimation;
