import { useState } from "react";
import { CalendarDays, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Refeicao = { nome: string; descricao: string; ingredientes: string[]; modo_preparo: string };
type DiaCardapio = { cafe_da_manha: Refeicao; lanche_manha: Refeicao; almoco: Refeicao; lanche_tarde: Refeicao; jantar: Refeicao };
type CardapioData = { cardapio: Record<string, DiaCardapio>; lista_compras: string[] };

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const DIAS_LABEL: Record<string, string> = {
  segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta",
  sexta: "Sexta", sabado: "Sábado", domingo: "Domingo",
};
const REFEICOES_LABEL: Record<string, string> = {
  cafe_da_manha: "☕ Café da Manhã", lanche_manha: "🍎 Lanche da Manhã",
  almoco: "🍽️ Almoço", lanche_tarde: "🥤 Lanche da Tarde", jantar: "🌙 Jantar",
};

const OBJETIVOS = [
  { value: "emagrecer", label: "🏃 Emagrecer", desc: "Perder peso de forma saudável" },
  { value: "ganhar_massa", label: "💪 Ganhar Massa", desc: "Aumentar massa muscular" },
  { value: "manter_saude", label: "🌿 Manter a Saúde", desc: "Alimentação equilibrada" },
];

const ORCAMENTOS = [
  { value: "econômico", label: "💰 Econômico", desc: "Até R$150/semana" },
  { value: "moderado", label: "💵 Moderado", desc: "R$150 a R$300/semana" },
  { value: "sem limite", label: "💎 Sem Limite", desc: "Foco na qualidade" },
];

const RESTRICOES = [
  { value: "nenhuma", label: "✅ Nenhuma" },
  { value: "vegetariano", label: "🥬 Vegetariano" },
  { value: "vegano", label: "🌱 Vegano" },
  { value: "sem glúten", label: "🚫🌾 Sem Glúten" },
  { value: "sem lactose", label: "🚫🥛 Sem Lactose" },
  { value: "low carb", label: "🥩 Low Carb" },
];

const DEFICIENCIAS = [
  { value: "nenhuma", label: "✅ Nenhuma" },
  { value: "ferro", label: "🩸 Ferro" },
  { value: "vitamina D", label: "☀️ Vitamina D" },
  { value: "vitamina B12", label: "💊 Vitamina B12" },
  { value: "cálcio", label: "🦴 Cálcio" },
  { value: "ômega 3", label: "🐟 Ômega 3" },
];

function OptionButton({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc?: string }) {
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
      <span className="font-medium text-sm text-foreground">{label}</span>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </button>
  );
}

function ChipButton({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
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
      {label}
    </button>
  );
}

export default function Cardapio() {
  const [loading, setLoading] = useState(false);
  const [cardapio, setCardapio] = useState<CardapioData | null>(null);
  const [showList, setShowList] = useState(false);
  const [prefs, setPrefs] = useState({
    objetivo: "", orcamento: "", pessoas: "1", restricoes: [] as string[], deficiencias: [] as string[],
  });

  const toggleArray = (arr: string[], val: string) => {
    if (val === "nenhuma") return ["nenhuma"];
    const without = arr.filter(v => v !== "nenhuma");
    return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
  };

  const gerarCardapio = async () => {
    if (!prefs.objetivo) { toast({ title: "Selecione um objetivo", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const preferences = {
        objetivo: OBJETIVOS.find(o => o.value === prefs.objetivo)?.label.replace(/^. /, "") || prefs.objetivo,
        orcamento: prefs.orcamento || "moderado",
        pessoas: prefs.pessoas,
        preferencias: "",
        restricoes: prefs.restricoes.filter(r => r !== "nenhuma").join(", ") || "nenhuma",
        deficiencias: prefs.deficiencias.filter(d => d !== "nenhuma").join(", ") || "nenhuma",
      };
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "cardapio", preferences },
      });
      if (error) throw error;
      const content = data.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");
      setCardapio(JSON.parse(jsonMatch[0]) as CardapioData);
      toast({ title: "Cardápio gerado com sucesso! 🥗" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar cardápio", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Meu Cardápio</h1>
      </div>

      {!cardapio ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Objetivo */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Qual é o seu objetivo?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OBJETIVOS.map(o => (
                <OptionButton key={o.value} selected={prefs.objetivo === o.value} onClick={() => setPrefs(p => ({ ...p, objetivo: o.value }))} label={o.label} desc={o.desc} />
              ))}
            </div>
          </div>

          {/* Orçamento */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Orçamento semanal</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ORCAMENTOS.map(o => (
                <OptionButton key={o.value} selected={prefs.orcamento === o.value} onClick={() => setPrefs(p => ({ ...p, orcamento: o.value }))} label={o.label} desc={o.desc} />
              ))}
            </div>
          </div>

          {/* Pessoas */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Para quantas pessoas?</Label>
            <div className="flex gap-2">
              {["1", "2", "3", "4", "5"].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, pessoas: n }))}
                  className={`h-10 w-10 rounded-full border-2 font-semibold text-sm transition-all ${
                    prefs.pessoas === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
              <Input
                type="number"
                min="1"
                placeholder="Outro"
                className="w-20 h-10"
                value={Number(prefs.pessoas) > 5 ? prefs.pessoas : ""}
                onChange={e => setPrefs(p => ({ ...p, pessoas: e.target.value }))}
              />
            </div>
          </div>

          {/* Restrições */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Restrições alimentares</Label>
            <div className="flex flex-wrap gap-2">
              {RESTRICOES.map(r => (
                <ChipButton key={r.value} selected={prefs.restricoes.includes(r.value)} onClick={() => setPrefs(p => ({ ...p, restricoes: toggleArray(p.restricoes, r.value) }))} label={r.label} />
              ))}
            </div>
          </div>

          {/* Deficiências */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Deficiências nutricionais</Label>
            <div className="flex flex-wrap gap-2">
              {DEFICIENCIAS.map(d => (
                <ChipButton key={d.value} selected={prefs.deficiencias.includes(d.value)} onClick={() => setPrefs(p => ({ ...p, deficiencias: toggleArray(p.deficiencias, d.value) }))} label={d.label} />
              ))}
            </div>
          </div>

          <Button onClick={gerarCardapio} disabled={loading} className="w-full sm:w-auto" size="lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando cardápio...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Cardápio Semanal</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowList(!showList)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> {showList ? "Ver Cardápio" : "Lista de Compras"}
            </Button>
            <Button variant="outline" onClick={() => setCardapio(null)}>Novo Cardápio</Button>
          </div>

          {showList ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">🛒 Lista de Compras</h2>
              <ul className="grid sm:grid-cols-2 gap-1">
                {cardapio.lista_compras?.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Tabs defaultValue="segunda">
              <TabsList className="flex-wrap h-auto gap-1">
                {DIAS.map(d => (
                  <TabsTrigger key={d} value={d} className="text-xs">{DIAS_LABEL[d]}</TabsTrigger>
                ))}
              </TabsList>
              {DIAS.map(dia => (
                <TabsContent key={dia} value={dia} className="space-y-3">
                  {cardapio.cardapio[dia] && Object.entries(cardapio.cardapio[dia]).map(([key, ref]) => (
                    <div key={key} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">{REFEICOES_LABEL[key] || key}</p>
                      <p className="font-semibold text-foreground">{(ref as Refeicao).nome}</p>
                      <p className="text-sm text-muted-foreground mt-1">{(ref as Refeicao).descricao}</p>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}
