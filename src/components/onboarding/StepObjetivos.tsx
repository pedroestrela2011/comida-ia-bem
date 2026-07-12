import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NIVEIS_ATIVIDADE, OBJETIVOS, REFEICOES_OPCOES } from "@/lib/health";
import { useState } from "react";

export type ObjetivosData = {
  objetivo: string;
  nivel_atividade: string;
  refeicoes_dia: number | null;
};

function Chip({
  selected,
  onClick,
  children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

export function StepObjetivos({
  initial,
  onBack,
  onNext,
}: {
  initial: ObjetivosData;
  onBack: () => void;
  onNext: (d: ObjetivosData) => void;
}) {
  const [data, setData] = useState<ObjetivosData>(initial);
  const [erro, setErro] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.objetivo || !data.nivel_atividade || !data.refeicoes_dia) {
      setErro("Preencha todos os campos.");
      return;
    }
    setErro("");
    onNext(data);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          O que você quer conquistar? 🎯
        </h2>
      </div>

      <div className="space-y-3">
        <Label>Objetivo principal</Label>
        <div className="grid gap-2">
          {OBJETIVOS.map((o) => (
            <Chip
              key={o}
              selected={data.objetivo === o}
              onClick={() => setData({ ...data, objetivo: o })}
            >
              <span className="font-medium text-sm text-foreground">{o}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Nível de atividade física</Label>
        <div className="grid gap-2">
          {NIVEIS_ATIVIDADE.map((n) => (
            <Chip
              key={n.value}
              selected={data.nivel_atividade === n.value}
              onClick={() => setData({ ...data, nivel_atividade: n.value })}
            >
              <span className="font-medium text-sm text-foreground">{n.value}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Quantas refeições faz por dia?</Label>
        <div className="grid grid-cols-5 gap-2">
          {REFEICOES_OPCOES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setData({ ...data, refeicoes_dia: n })}
              className={`rounded-lg border-2 py-3 text-sm font-semibold transition-all ${
                data.refeicoes_dia === n
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="h-12 gap-2">
          <ArrowLeft size={18} /> Voltar
        </Button>
        <Button type="submit" size="lg" className="flex-1 h-12 gap-2">
          Continuar <ArrowRight size={18} />
        </Button>
      </div>
    </form>
  );
}
