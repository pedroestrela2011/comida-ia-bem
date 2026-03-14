import { useState, useEffect } from "react";
import { Dumbbell, Loader2, Sparkles, Clock, Flame, Wheat, Droplets, Salad, BarChart3, Lightbulb, BookOpen, ArrowLeft, Trash2, ShoppingCart, Zap, Shield, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Refeicao = {
  nome: string; descricao: string; ingredientes: string[]; modo_preparo: string[] | string;
  tempo_preparo?: string; dificuldade?: string; dicas?: string;
  informacoes_nutricionais?: { calorias?: string; proteinas?: string; carboidratos?: string; gorduras?: string; fibras?: string };
  vitaminas?: string[]; minerais?: string[]; beneficio_esportivo?: string;
};
type DiaCardapio = Record<string, Refeicao>;
type CardapioEsporteData = { cardapio: Record<string, DiaCardapio>; lista_compras: string[]; resumo_nutricional?: string };

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const DIAS_LABEL: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};
const REFEICOES_ORDER = ["cafe_da_manha", "lanche_pre_treino", "almoco", "lanche_pos_treino", "jantar"];
const REFEICOES_LABEL: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_pre_treino: "Pré-Treino", almoco: "Almoço",
  lanche_pos_treino: "Pós-Treino", jantar: "Jantar",
};

const INTENSIDADES = [
  { value: "leve", label: "Leve", desc: "Atividade tranquila" },
  { value: "moderado", label: "Moderado", desc: "Esforço equilibrado" },
  { value: "intenso", label: "Intenso", desc: "Alta performance" },
];

const OBJETIVOS = [
  { value: "melhorar desempenho", label: "Melhorar Desempenho" },
  { value: "ganhar massa", label: "Ganhar Massa" },
  { value: "aumentar resistência", label: "Aumentar Resistência" },
  { value: "recuperação muscular", label: "Recuperação Muscular" },
  { value: "emagrecimento", label: "Emagrecimento" },
];

const RESTRICOES = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sem glúten", label: "Sem Glúten" },
  { value: "sem lactose", label: "Sem Lactose" },
  { value: "low carb", label: "Low Carb" },
];

function OptionButton({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border-2 p-3 text-left transition-all ${selected ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}>
      <span className="font-medium text-sm text-foreground">{label}</span>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </button>
  );
}

function ChipButton({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
      {label}
    </button>
  );
}

const difficultyColor = (d?: string) => {
  if (!d) return "secondary" as const;
  const l = d.toLowerCase();
  if (l.includes("fácil") || l.includes("facil")) return "default" as const;
  if (l.includes("médio") || l.includes("medio")) return "secondary" as const;
  return "destructive" as const;
};

function RefeicaoEsporteDetail({ refeicao, label }: { refeicao: Refeicao; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const steps = Array.isArray(refeicao.modo_preparo) ? refeicao.modo_preparo : refeicao.modo_preparo ? [refeicao.modo_preparo] : [];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-muted/30 transition-colors">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">{refeicao.nome}</p>
          <div className="flex items-center gap-2">
            {refeicao.tempo_preparo && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{refeicao.tempo_preparo}</span>}
            {refeicao.dificuldade && <Badge variant={difficultyColor(refeicao.dificuldade)} className="text-xs">{refeicao.dificuldade}</Badge>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{refeicao.descricao}</p>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {refeicao.beneficio_esportivo && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs"><strong>Benefício esportivo:</strong> {refeicao.beneficio_esportivo}</p>
            </div>
          )}

          {refeicao.informacoes_nutricionais && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold"><BarChart3 className="h-3.5 w-3.5 text-primary" /> Informações Nutricionais</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {refeicao.informacoes_nutricionais.calorias && <div className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{refeicao.informacoes_nutricionais.calorias}</div>}
                {refeicao.informacoes_nutricionais.proteinas && <div className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-red-500" />{refeicao.informacoes_nutricionais.proteinas}</div>}
                {refeicao.informacoes_nutricionais.carboidratos && <div className="flex items-center gap-1"><Wheat className="h-3 w-3 text-amber-500" />{refeicao.informacoes_nutricionais.carboidratos}</div>}
                {refeicao.informacoes_nutricionais.gorduras && <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-yellow-500" />{refeicao.informacoes_nutricionais.gorduras}</div>}
                {refeicao.informacoes_nutricionais.fibras && <div className="flex items-center gap-1"><Salad className="h-3 w-3 text-green-500" />{refeicao.informacoes_nutricionais.fibras}</div>}
              </div>
            </div>
          )}

          {refeicao.vitaminas && refeicao.vitaminas.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold"><Pill className="h-3.5 w-3.5 text-primary" /> Vitaminas</div>
              <div className="flex flex-wrap gap-1.5">
                {refeicao.vitaminas.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5 border-primary/20">{v}</Badge>
                ))}
              </div>
            </div>
          )}

          {refeicao.minerais && refeicao.minerais.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold"><Shield className="h-3.5 w-3.5 text-primary" /> Sais Minerais</div>
              <div className="flex flex-wrap gap-1.5">
                {refeicao.minerais.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-accent/10 border-accent/30">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-1.5">Ingredientes</h4>
            <ul className="space-y-1">
              {refeicao.ingredientes?.map((ing, i) => (
                <li key={i} className="text-xs flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-primary shrink-0" />{ing}</li>
              ))}
            </ul>
          </div>

          {steps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5">Modo de Preparo</h4>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {refeicao.dicas && (
            <div className="rounded-lg bg-muted p-2.5 flex gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs"><strong>Dica:</strong> {refeicao.dicas}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModoEsporte() {
  const [loading, setLoading] = useState(false);
  const [cardapio, setCardapio] = useState<CardapioEsporteData | null>(null);
  const [showList, setShowList] = useState(false);
  const [mainTab, setMainTab] = useState("criar");
  const [savedCardapios, setSavedCardapios] = useState<{ id: string; dados: CardapioEsporteData; created_at: string }[]>([]);
  const [viewingSaved, setViewingSaved] = useState<{ id: string; dados: CardapioEsporteData; created_at: string } | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [prefs, setPrefs] = useState({
    esporte: "", frequencia: "", intensidade: "", desconforto: "",
    fraqueza: "", objetivo: "", restricoes: [] as string[],
  });

  const fetchSaved = async () => {
    setLoadingSaved(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const result: any = await supabase
        .from("cardapios_salvos")
        .select("id, dados, created_at, tipo")
        .eq("user_id", user.id)
        .eq("tipo", "esporte")
        .order("created_at", { ascending: false });
      const { data, error } = result;
      if (error) throw error;
      setSavedCardapios((data || []).map((d: any) => ({ id: d.id, dados: d.dados as CardapioEsporteData, created_at: d.created_at })));
    } catch (e: any) {
      console.error("Erro ao carregar cardápios:", e.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => { fetchSaved(); }, []);

  const toggleArray = (arr: string[], val: string) => {
    if (val === "nenhuma") return ["nenhuma"];
    const without = arr.filter(v => v !== "nenhuma");
    return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
  };

  const gerarCardapio = async () => {
    if (!prefs.esporte) { toast({ title: "Informe o esporte que pratica", variant: "destructive" }); return; }
    if (!prefs.objetivo) { toast({ title: "Selecione um objetivo", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const preferences = {
        esporte: prefs.esporte,
        frequencia: prefs.frequencia || "não especificado",
        intensidade: prefs.intensidade || "moderado",
        desconforto: prefs.desconforto || "nenhum",
        fraqueza: prefs.fraqueza || "não",
        objetivo: prefs.objetivo,
        restricoes: prefs.restricoes.filter(r => r !== "nenhuma").join(", ") || "nenhuma",
      };
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "cardapio_esporte", preferences },
      });
      if (error) throw error;
      const content = data.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");
      const parsed = JSON.parse(jsonMatch[0]) as CardapioEsporteData;
      setCardapio(parsed);

      // Auto-save
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: saved, error: saveErr } = await supabase
          .from("cardapios_salvos")
          .insert({ user_id: user.id, dados: parsed as unknown as Record<string, unknown>, tipo: "esporte" } as any)
          .select("id, dados, created_at")
          .single();
        if (!saveErr && saved) {
          setSavedCardapios(prev => [{ id: saved.id, dados: saved.dados as unknown as CardapioEsporteData, created_at: saved.created_at }, ...prev]);
        }
      }

      toast({ title: "Cardápio esportivo gerado e salvo!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar cardápio", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deletarCardapio = async (id: string) => {
    try {
      const { error } = await supabase.from("cardapios_salvos").delete().eq("id", id);
      if (error) throw error;
      setSavedCardapios(prev => prev.filter(c => c.id !== id));
      if (viewingSaved?.id === id) setViewingSaved(null);
      toast({ title: "Cardápio removido" });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const renderCardapioView = (data: CardapioEsporteData) => (
    <div className="space-y-4">
      {data.resumo_nutricional && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
          <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground mb-1">Estratégia Nutricional</p>
            <p className="text-sm text-muted-foreground">{data.resumo_nutricional}</p>
          </div>
        </div>
      )}

      {showList ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Lista de Compras</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-1">
            {data.lista_compras?.map((item, i) => (
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
              {data.cardapio[dia] && REFEICOES_ORDER
                .filter(key => (data.cardapio[dia] as any)[key])
                .map(key => (
                  <RefeicaoEsporteDetail key={key} refeicao={(data.cardapio[dia] as any)[key] as Refeicao} label={REFEICOES_LABEL[key] || key} />
                ))}
              {data.cardapio[dia] && Object.entries(data.cardapio[dia])
                .filter(([key]) => !REFEICOES_ORDER.includes(key))
                .map(([key, ref]) => (
                  <RefeicaoEsporteDetail key={key} refeicao={ref as Refeicao} label={REFEICOES_LABEL[key] || key} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 md:gap-3">
        <Dumbbell className="h-6 w-6 md:h-7 md:w-7 text-primary" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Modo Esporte</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Cardápio personalizado para seu desempenho esportivo</p>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="criar" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Criar
          </TabsTrigger>
          <TabsTrigger value="salvos" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Salvos ({savedCardapios.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-4">
          {!cardapio ? (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Qual esporte você pratica?</Label>
                <Input placeholder="Ex: futebol, corrida, musculação, natação..."
                  value={prefs.esporte}
                  onChange={e => setPrefs(p => ({ ...p, esporte: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Quantas vezes por semana?</Label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5", "6", "7"].map(n => (
                    <button key={n} type="button" onClick={() => setPrefs(p => ({ ...p, frequencia: n }))}
                      className={`h-10 w-10 rounded-full border-2 font-semibold text-sm transition-all ${prefs.frequencia === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Intensidade do treino</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INTENSIDADES.map(o => (
                    <OptionButton key={o.value} selected={prefs.intensidade === o.value} onClick={() => setPrefs(p => ({ ...p, intensidade: o.value }))} label={o.label} desc={o.desc} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Sente algum desconforto durante a prática?</Label>
                <Textarea placeholder="Ex: dor no joelho, câimbras, falta de ar..."
                  value={prefs.desconforto} onChange={e => setPrefs(p => ({ ...p, desconforto: e.target.value }))} rows={2} />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Sente fraqueza ou falta de energia durante o treino?</Label>
                <div className="flex gap-3">
                  {[{ value: "sim", label: "Sim" }, { value: "não", label: "Não" }, { value: "às vezes", label: "Às vezes" }].map(o => (
                    <ChipButton key={o.value} selected={prefs.fraqueza === o.value} onClick={() => setPrefs(p => ({ ...p, fraqueza: o.value }))} label={o.label} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Qual é o seu objetivo?</Label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS.map(o => (
                    <ChipButton key={o.value} selected={prefs.objetivo === o.value} onClick={() => setPrefs(p => ({ ...p, objetivo: o.value }))} label={o.label} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Restrições alimentares</Label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICOES.map(r => (
                    <ChipButton key={r.value} selected={prefs.restricoes.includes(r.value)} onClick={() => setPrefs(p => ({ ...p, restricoes: toggleArray(p.restricoes, r.value) }))} label={r.label} />
                  ))}
                </div>
              </div>

              <Button onClick={gerarCardapio} disabled={loading} className="w-full sm:w-auto" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando cardápio esportivo...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Cardápio Esportivo</>}
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
              {renderCardapioView(cardapio)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salvos" className="space-y-4">
          {viewingSaved ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setViewingSaved(null)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
              </Button>
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => setShowList(!showList)}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> {showList ? "Ver Cardápio" : "Lista de Compras"}
                </Button>
              </div>
              {renderCardapioView(viewingSaved.dados)}
            </>
          ) : savedCardapios.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum cardápio esportivo salvo ainda.</p>
              <p className="text-sm mt-1">Gere um cardápio e ele será salvo automaticamente.</p>
            </div>
          ) : (
            savedCardapios.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="cursor-pointer flex-1" onClick={() => setViewingSaved(c)}>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    Cardápio Esportivo de {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{Object.keys(c.dados.cardapio || {}).length} dias · {c.dados.lista_compras?.length || 0} itens na lista</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deletarCardapio(c.id); }}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
