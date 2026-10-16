import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChefHat, ChevronLeft, ChevronRight, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  steps: string[];
  title?: string;
  size?: "sm" | "default";
  ingredientes?: string[];
  porcoesLabel?: string;
}

export function CookingModeButton({ steps, title, size = "sm", ingredientes, porcoesLabel }: Props) {
  const [open, setOpen] = useState(false);
  if (!steps?.length) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" className={size === "sm" ? "h-7 px-2 text-xs gap-1" : "gap-1.5"} onClick={() => setOpen(true)}>
        <ChefHat className="h-3.5 w-3.5" /> Modo cozinha
      </Button>
      {open && <CookingModeScreen steps={steps} title={title} ingredientes={ingredientes} porcoesLabel={porcoesLabel} onClose={() => setOpen(false)} />}
    </>
  );
}

function CookingModeScreen({ steps, title, ingredientes, porcoesLabel, onClose }: { steps: string[]; title?: string; ingredientes?: string[]; porcoesLabel?: string; onClose: () => void }) {
  const [showIng, setShowIng] = useState(false);
  const panelOpen = useRef(false);
  panelOpen.current = showIng;

  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const reduce = useReducedMotion();
  const total = steps.length;

  const go = (d: number) => setState(([i]) => {
    const n = Math.min(total - 1, Math.max(0, i + d));
    return n === i ? [i, 0] : [n, d];
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (panelOpen.current) { setShowIng(false); return; } onClose(); }
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
        <div className="flex items-center gap-2">
          {!!ingredientes?.length && (
            <Button variant="outline" size="sm" onClick={() => setShowIng(true)} className="gap-1.5" aria-expanded={showIng}>
              <ListChecks className="h-4 w-4" /> Ingredientes
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
            <X className="h-4 w-4" /> Fechar e voltar à receita
          </Button>
        </div>
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

      <AnimatePresence>
        {showIng && (
          <>
            <motion.div
              className="absolute inset-0 z-10 bg-foreground/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={() => setShowIng(false)}
              aria-hidden="true"
            />
            <motion.aside
              role="dialog" aria-label="Ingredientes"
              className="absolute right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col border-l bg-background shadow-xl"
              initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">Ingredientes</h2>
                  {porcoesLabel && <p className="text-xs text-muted-foreground">{porcoesLabel}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowIng(false)} aria-label="Fechar ingredientes">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {ingredientes!.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{ing}
                  </li>
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}
