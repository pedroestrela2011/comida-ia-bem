import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChefHat, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  steps: string[];
  title?: string;
  size?: "sm" | "default";
}

export function CookingModeButton({ steps, title, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  if (!steps?.length) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" className={size === "sm" ? "h-7 px-2 text-xs gap-1" : "gap-1.5"} onClick={() => setOpen(true)}>
        <ChefHat className="h-3.5 w-3.5" /> Modo cozinha
      </Button>
      {open && <CookingModeScreen steps={steps} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

function CookingModeScreen({ steps, title, onClose }: { steps: string[]; title?: string; onClose: () => void }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const reduce = useReducedMotion();
  const total = steps.length;

  const go = (d: number) => setState(([i]) => {
    const n = Math.min(total - 1, Math.max(0, i + d));
    return n === i ? [i, 0] : [n, d];
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);

  const offset = reduce ? 0 : 60;

  return createPortal(
    <motion.div
      role="dialog" aria-modal="true" aria-label="Modo cozinha"
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold truncate">{title || "Modo cozinha"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
          <X className="h-4 w-4" /> Fechar e voltar à receita
        </Button>
      </header>

      <div className="h-1.5 bg-muted">
        <motion.div className="h-full bg-primary" animate={{ width: `${((index + 1) / total) * 100}%` }} transition={{ duration: reduce ? 0 : 0.3 }} />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8">
        <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-primary">Passo {index + 1} de {total}</p>
        <div className="relative w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.p
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * offset }}
              transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
              className="text-center text-2xl font-medium leading-relaxed sm:text-4xl sm:leading-snug"
            >
              {steps[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-3 border-t px-4 py-4 sm:px-8">
        <Button variant="outline" size="lg" onClick={() => go(-1)} disabled={index === 0} className="gap-1.5">
          <ChevronLeft className="h-5 w-5" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">{index + 1} de {total}</span>
        {index < total - 1 ? (
          <Button size="lg" onClick={() => go(1)} className="gap-1.5">
            Próximo <ChevronRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="lg" onClick={onClose}>Concluir</Button>
        )}
      </footer>
    </motion.div>,
    document.body,
  );
}
