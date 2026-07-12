import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { calcIdade, unitsForCountry, lbToKg, ftToCm } from "@/lib/health";
import { useMemo, useState } from "react";

export type CorpoData = {
  peso: string;
  altura: string;
};

export function StepCorpo({
  initial,
  dataNascimento,
  pais,
  onNext,
}: {
  initial: CorpoData;
  dataNascimento?: string | null;
  pais?: string | null;
  onNext: (d: { peso_kg: number; altura_cm: number; raw: CorpoData }) => void;
}) {
  const [peso, setPeso] = useState(initial.peso);
  const [altura, setAltura] = useState(initial.altura);
  const [erro, setErro] = useState("");
  const units = useMemo(() => unitsForCountry(pais), [pais]);
  const idade = calcIdade(dataNascimento || null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = parseFloat(peso.replace(",", "."));
    const alturaNum = parseFloat(altura.replace(",", "."));
    if (!pesoNum || !alturaNum) {
      setErro("Preencha peso e altura.");
      return;
    }
    const peso_kg = units.peso === "lb" ? lbToKg(pesoNum) : pesoNum;
    const altura_cm = units.altura === "ft" ? ftToCm(alturaNum) : alturaNum;
    if (peso_kg < 20 || peso_kg > 400) return setErro("Peso fora de faixa.");
    if (altura_cm < 80 || altura_cm > 260) return setErro("Altura fora de faixa.");
    setErro("");
    onNext({
      peso_kg: Math.round(peso_kg * 10) / 10,
      altura_cm: Math.round(altura_cm * 10) / 10,
      raw: { peso, altura },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Vamos conhecer você melhor 💪
        </h2>
        <p className="text-muted-foreground">
          Essas informações tornam tudo mais personalizado para você
        </p>
        {idade != null && (
          <p className="text-xs text-muted-foreground">
            Sua idade ({idade} anos) foi calculada a partir do seu cadastro.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="peso">Peso atual ({units.peso})</Label>
        <Input
          id="peso"
          inputMode="decimal"
          placeholder={units.peso === "lb" ? "ex: 165" : "ex: 75"}
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="altura">Altura ({units.altura})</Label>
        <Input
          id="altura"
          inputMode="decimal"
          placeholder={units.altura === "ft" ? "ex: 5.9" : "ex: 175"}
          value={altura}
          onChange={(e) => setAltura(e.target.value)}
        />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" size="lg" className="w-full h-12 gap-2">
        Continuar <ArrowRight size={18} />
      </Button>
    </form>
  );
}
