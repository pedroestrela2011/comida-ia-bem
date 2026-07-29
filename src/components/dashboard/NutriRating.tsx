import { Star, Target } from "lucide-react";

export type AvaliacaoObjetivo = {
  objetivo?: string;
  nota?: number;
  justificativa?: string;
};

const colorFor = (nota: number) => {
  if (nota <= 2) return "#ef4444";
  if (nota <= 3.5) return "#f59e0b";
  return "#2d6a4f";
};

export function NutriRating({ avaliacao }: { avaliacao?: AvaliacaoObjetivo | null }) {
  if (!avaliacao || typeof avaliacao.nota !== "number") return null;
  const nota = Math.max(0, Math.min(5, Number(avaliacao.nota)));
  const color = colorFor(nota);

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Avaliação Nutricional para seu Objetivo</h3>
        {avaliacao.objetivo && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }}
          >
            <Target className="h-3.5 w-3.5" /> {avaliacao.objetivo}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = Math.max(0, Math.min(1, nota - i));
            return (
              <span key={i} className="relative inline-block h-5 w-5">
                <Star className="absolute inset-0 h-5 w-5 text-muted-foreground/40" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className="h-5 w-5" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                </span>
              </span>
            );
          })}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {nota.toFixed(1)} / 5
        </span>
      </div>

      {avaliacao.justificativa && (
        <p
          className="rounded-lg border-l-4 bg-muted/40 p-3 text-sm"
          style={{ borderColor: color, color }}
        >
          {avaliacao.justificativa}
        </p>
      )}
    </div>
  );
}
