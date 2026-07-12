import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { CONDICOES_OPCOES, RESTRICOES_OPCOES } from "@/lib/health";
import { useState } from "react";

export type SaudeData = {
  restricoes: string[];
  alergias: string;
  condicoes: string[];
  condicoes_outras: string;
};

function toggle(arr: string[], val: string) {
  if (val === "Nenhuma") return ["Nenhuma"];
  const without = arr.filter((v) => v !== "Nenhuma");
  return without.includes(val) ? without.filter((v) => v !== val) : [...without, val];
}

function Chip({
  selected,
  onClick,
  children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

export function StepSaude({
  initial,
  submitting,
  onBack,
  onSubmit,
}: {
  initial: SaudeData;
  submitting?: boolean;
  onBack: () => void;
  onSubmit: (d: SaudeData) => void;
}) {
  const [data, setData] = useState<SaudeData>(initial);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const showOutras = data.condicoes.includes("Outras");

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Conte-nos sobre sua saúde 🌿
        </h2>
        <p className="text-muted-foreground">
          Essas informações ajudam a evitar sugestões inadequadas para você
        </p>
      </div>

      <div className="space-y-3">
        <Label>Restrições alimentares</Label>
        <div className="flex flex-wrap gap-2">
          {RESTRICOES_OPCOES.map((r) => (
            <Chip
              key={r}
              selected={data.restricoes.includes(r)}
              onClick={() => setData({ ...data, restricoes: toggle(data.restricoes, r) })}
            >
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alergias">Alergias alimentares</Label>
        <Textarea
          id="alergias"
          placeholder="Descreva alergias, se houver (ex: amendoim, ovo, camarão)"
          value={data.alergias}
          onChange={(e) => setData({ ...data, alergias: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label>Condições de saúde</Label>
        <div className="flex flex-wrap gap-2">
          {CONDICOES_OPCOES.map((c) => (
            <Chip
              key={c}
              selected={data.condicoes.includes(c)}
              onClick={() => setData({ ...data, condicoes: toggle(data.condicoes, c) })}
            >
              {c}
            </Chip>
          ))}
        </div>
        {showOutras && (
          <Input
            placeholder="Especifique outras condições"
            value={data.condicoes_outras}
            onChange={(e) => setData({ ...data, condicoes_outras: e.target.value })}
          />
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Essas informações são usadas apenas para personalização. Sempre consulte um profissional de saúde antes de iniciar qualquer dieta.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="h-12 gap-2">
          <ArrowLeft size={18} /> Voltar
        </Button>
        <Button type="submit" size="lg" disabled={submitting} className="flex-1 h-12 gap-2">
          {submitting ? "Salvando..." : "Concluir e Continuar"} {!submitting && <ArrowRight size={18} />}
        </Button>
      </div>
    </form>
  );
}
