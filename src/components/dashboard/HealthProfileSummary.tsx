import { HeartPulse, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { HealthProfile } from "@/lib/health";

/**
 * Compact banner used across features that consume the user's onboarding
 * health profile. It shows the data that WOULD have been asked again and
 * links the user to Configurações → Saúde to edit.
 */
export function HealthProfileSummary({
  profile,
  fields = ["objetivo", "restricoes", "condicoes", "alergias"],
  className = "",
}: {
  profile: (HealthProfile & { [k: string]: any }) | null;
  fields?: Array<"objetivo" | "nivel_atividade" | "restricoes" | "condicoes" | "alergias" | "refeicoes">;
  className?: string;
}) {
  if (!profile) return null;

  const items: { label: string; value: string }[] = [];
  if (fields.includes("objetivo") && profile.objetivo)
    items.push({ label: "Objetivo", value: profile.objetivo });
  if (fields.includes("nivel_atividade") && profile.nivel_atividade)
    items.push({ label: "Atividade", value: profile.nivel_atividade });
  if (fields.includes("refeicoes") && profile.refeicoes_dia)
    items.push({ label: "Refeições/dia", value: String(profile.refeicoes_dia) });
  if (fields.includes("restricoes")) {
    const rest = (profile.restricoes_alimentares || []).filter(
      (r: string) => r && r !== "Nenhuma",
    );
    items.push({ label: "Restrições", value: rest.length ? rest.join(", ") : "Nenhuma" });
  }
  if (fields.includes("condicoes")) {
    const cond = (profile.condicoes_saude || []).filter(
      (c: string) => c && c !== "Nenhuma",
    );
    const extras = profile.condicoes_outras ? [profile.condicoes_outras] : [];
    const all = [...cond, ...extras];
    items.push({ label: "Condições de saúde", value: all.length ? all.join(", ") : "Nenhuma" });
  }
  if (fields.includes("alergias"))
    items.push({ label: "Alergias", value: profile.alergias || "Nenhuma" });

  if (!items.length) return null;

  return (
    <div
      className={`rounded-xl border border-primary/20 bg-primary/5 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <HeartPulse className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              Usando seus dados de saúde
            </p>
            <Link
              to="/dashboard/configuracoes?tab=saude"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Settings2 className="h-3 w-3" /> Editar em Configurações
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estes dados vêm do seu cadastro e não precisam ser preenchidos novamente.
            A IA usa tudo — inclusive suas condições de saúde — para personalizar o resultado.
          </p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {items.map((it) => (
              <div key={it.label} className="text-xs">
                <span className="text-muted-foreground">{it.label}: </span>
                <span className="font-medium text-foreground">{it.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
