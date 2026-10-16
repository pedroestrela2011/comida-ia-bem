import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIngredient } from "@/lib/scale-ingredient";
import { cn } from "@/lib/utils";

interface Props {
  ingredientes: string[];
  basePorcoes: number;
  compact?: boolean;
  porcoes?: number;
  onPorcoesChange?: (n: number) => void;
}

export function ServingsIngredients({ ingredientes, basePorcoes, compact, porcoes: controlled, onPorcoesChange }: Props) {
  const [local, setLocal] = useState(basePorcoes);
  const porcoes = controlled ?? local;
  const setPorcoes = (fn: (p: number) => number) => { const n = fn(porcoes); setLocal(n); onPorcoesChange?.(n); };
  const factor = porcoes / basePorcoes;
  return (
    <div>
      <div className={cn("flex items-center justify-between gap-2", compact ? "mb-1.5" : "mb-2")}>
        <h4 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>Ingredientes</h4>
        <div className="flex items-center gap-1.5" aria-label="Seletor de porções">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPorcoes((p) => Math.max(1, p - 1))} disabled={porcoes <= 1} aria-label="Diminuir porções">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[78px] text-center text-xs font-medium" aria-live="polite">
            {porcoes} {porcoes === 1 ? "porção" : "porções"}
          </span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPorcoes((p) => Math.min(50, p + 1))} aria-label="Aumentar porções">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ul className="space-y-1">
        {ingredientes.map((ing, i) => (
          <li key={i} className={cn("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
            <span className={cn("rounded-full bg-primary shrink-0", compact ? "h-1 w-1" : "h-1.5 w-1.5")} />
            {scaleIngredient(ing, factor)}
          </li>
        ))}
      </ul>
    </div>
  );
}
