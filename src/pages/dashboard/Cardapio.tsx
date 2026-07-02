import { useState, useEffect } from "react";
import { CalendarDays, ShoppingCart, Loader2, Sparkles, Clock, Flame, Dumbbell, Wheat, Droplets, Salad, BarChart3, Lightbulb, BookOpen, ArrowLeft, ThumbsUp, ThumbsDown, Trash2, RefreshCw, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { exportCardapioPDF } from "@/lib/cardapio-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDailyScore } from "@/hooks/useDailyScore";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";

type Refeicao = {
  nome: string; descricao: string; ingredientes: string[]; modo_preparo: string[] | string;
  tempo_preparo?: string; dificuldade?: string; dicas?: string;
  informacoes_nutricionais?: { calorias?: string; proteinas?: string; carboidratos?: string; gorduras?: string; fibras?: string };
};
type DiaCardapio = { cafe_da_manha: Refeicao; lanche_manha: Refeicao; almoco: Refeicao; lanche_tarde: Refeicao; jantar: Refeicao };
type CardapioData = { cardapio: Record<string, DiaCardapio>; lista_compras: string[] };

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const DIAS_LABEL: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
  sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};
const REFEICOES_ORDER = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"];
const REFEICOES_LABEL: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_manha: "Lanche da Manhã",
  almoco: "Almoço", lanche_tarde: "Lanche da Tarde", jantar: "Jantar",
};
const REFEICOES_ICON: Record<string, string> = {
  cafe_da_manha: "coffee", lanche_manha: "apple", almoco: "utensils", lanche_tarde: "cup-soda", jantar: "moon",
};

const OBJETIVOS = [
  { value: "emagrecer", label: "Emagrecer", desc: "Perder peso de forma saudável" },
  { value: "ganhar_massa", label: "Ganhar Massa", desc: "Aumentar massa muscular" },
  { value: "manter_saude", label: "Manter a Saúde", desc: "Alimentação equilibrada" },
];

const ORCAMENTOS = [
  { value: "econômico", label: "Econômico", desc: "Até R$150/semana" },
  { value: "moderado", label: "Moderado", desc: "R$150 a R$300/semana" },
  { value: "sem limite", label: "Sem Limite", desc: "Foco na qualidade" },
];

const RESTRICOES = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sem glúten", label: "Sem Glúten" },
  { value: "sem lactose", label: "Sem Lactose" },
  { value: "low carb", label: "Low Carb" },
];

const DEFICIENCIAS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "ferro", label: "Ferro" },
  { value: "vitamina D", label: "Vitamina D" },
  { value: "vitamina B12", label: "Vitamina B12" },
  { value: "cálcio", label: "Cálcio" },
  { value: "ômega 3", label: "Ômega 3" },
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

function RefeicaoDetail({ refeicao, label, onSwap }: { refeicao: Refeicao; label: string; onSwap?: (preferencia: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [swapText, setSwapText] = useState("");
  const steps = Array.isArray(refeicao.modo_preparo) ? refeicao.modo_preparo : refeicao.modo_preparo ? [refeicao.modo_preparo] : [];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden relative">
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          recipe={{
            nome: refeicao.nome,
            descricao: refeicao.descricao,
            tempo_preparo: refeicao.tempo_preparo,
            dificuldade: refeicao.dificuldade,
            ingredientes: refeicao.ingredientes,
            modo_preparo: refeicao.modo_preparo,
            dicas: refeicao.dicas,
            informacoes_nutricionais: refeicao.informacoes_nutricionais,
          }}
          origem="cardapio"
          size="sm"
        />
      </div>
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full p-4 pr-12 text-left hover:bg-muted/30 transition-colors">
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
          {onSwap && (
            <div className="space-y-2">
              {!showSwap ? (
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowSwap(true); }}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Trocar Prato
                </Button>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">O que gostaria no lugar?</p>
                  <Input
                    placeholder="Ex: algo com frango, uma salada leve... (opcional)"
                    value={swapText}
                    onChange={e => setSwapText(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { onSwap(swapText); setShowSwap(false); setSwapText(""); }}>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Gerar Alternativa
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowSwap(false); setSwapText(""); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
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

export default function Cardapio() {
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [cardapio, setCardapio] = useState<CardapioData | null>(null);
  const [showList, setShowList] = useState(false);
  const [mainTab, setMainTab] = useState("criar");
  const [savedCardapios, setSavedCardapios] = useState<{ id: string; dados: CardapioData; created_at: string; tipo: string }[]>([]);
  const [viewingSaved, setViewingSaved] = useState<{ id: string; dados: CardapioData; created_at: string; tipo: string } | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfMode, setPdfMode] = useState<"dia" | "semana">("semana");
  const [pdfSource, setPdfSource] = useState<CardapioData | null>(null);

  const openPdfDialog = (data: CardapioData) => {
    setPdfSource(data);
    setPdfMode("semana");
    setPdfDialogOpen(true);
  };

  const confirmPdf = () => {
    if (!pdfSource) return;
    try {
      exportCardapioPDF(pdfSource, pdfMode);
      setPdfDialogOpen(false);
      toast({ title: "PDF gerado com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e.message, variant: "destructive" });
    }
  };
  const { registerAction } = useDailyScore();
  const [prefs, setPrefs] = useState({
    objetivo: "", orcamento: "", pessoas: "1", restricoes: [] as string[], deficiencias: [] as string[],
    gosta: "", nao_gosta: "",
  });

  const fetchSaved = async () => {
    setLoadingSaved(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("cardapios_salvos")
        .select("id, dados, created_at, tipo")
        .eq("user_id", user.id)
        .eq("tipo", "normal")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSavedCardapios((data || []).map(d => ({ id: d.id, dados: d.dados as unknown as CardapioData, created_at: d.created_at, tipo: d.tipo || "normal" })));
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
    if (!prefs.objetivo) { toast({ title: "Selecione um objetivo", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const preferences = {
        objetivo: OBJETIVOS.find(o => o.value === prefs.objetivo)?.label || prefs.objetivo,
        orcamento: prefs.orcamento || "moderado",
        pessoas: prefs.pessoas,
        preferencias: prefs.gosta || "nenhuma especial",
        nao_gosta: prefs.nao_gosta || "nenhum",
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
      toast({ title: "Cardápio gerado com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar cardápio", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const salvarCardapio = async () => {
    if (!cardapio) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Faça login para salvar", variant: "destructive" }); return; }
      const { data, error } = await supabase
        .from("cardapios_salvos")
        .insert({ user_id: user.id, dados: cardapio as unknown as Record<string, unknown>, tipo: "normal" } as any)
        .select("id, dados, created_at, tipo")
        .single();
      if (error) throw error;
      setSavedCardapios(prev => [{ id: data.id, dados: data.dados as unknown as CardapioData, created_at: data.created_at, tipo: data.tipo || "normal" }, ...prev]);
      await registerAction("cardapio", 40, { action: "salvar_cardapio" });
      toast({ title: "Cardápio salvo!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
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

  const substituirRefeicao = async (targetData: CardapioData, setTargetData: (d: CardapioData) => void, dia: string, tipoRefeicao: string, preferencia: string) => {
    const swapKey = `${dia}-${tipoRefeicao}`;
    setSwapping(swapKey);
    try {
      const refeicaoAtual = (targetData.cardapio[dia] as any)?.[tipoRefeicao] as Refeicao;
      if (!refeicaoAtual) return;
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "substituir_refeicao",
          preferences: {
            refeicao_atual: refeicaoAtual.nome,
            tipo_refeicao: REFEICOES_LABEL[tipoRefeicao] || tipoRefeicao,
            preferencia,
            objetivo: prefs.objetivo ? OBJETIVOS.find(o => o.value === prefs.objetivo)?.label : "",
            restricoes: prefs.restricoes.filter(r => r !== "nenhuma").join(", ") || "nenhuma",
          },
        },
      });
      if (error) throw error;
      const content = data.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");
      const novaRefeicao = JSON.parse(jsonMatch[0]) as Refeicao;
      const novoCardapio = { ...targetData, cardapio: { ...targetData.cardapio, [dia]: { ...targetData.cardapio[dia], [tipoRefeicao]: novaRefeicao } } };
      setTargetData(novoCardapio);
      toast({ title: "Prato substituído!", description: `"${refeicaoAtual.nome}" → "${novaRefeicao.nome}"` });
    } catch (e: any) {
      toast({ title: "Erro ao substituir", description: e.message, variant: "destructive" });
    } finally {
      setSwapping(null);
    }
  };

  const renderCardapioView = (data: CardapioData, setTargetData?: (d: CardapioData) => void) => (
    <div className="space-y-4">
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
                  <RefeicaoDetail key={key} refeicao={(data.cardapio[dia] as any)[key] as Refeicao} label={REFEICOES_LABEL[key] || key}
                    onSwap={setTargetData ? (pref) => substituirRefeicao(data, setTargetData, dia, key, pref) : undefined} />
                ))}
              {data.cardapio[dia] && Object.entries(data.cardapio[dia])
                .filter(([key]) => !REFEICOES_ORDER.includes(key))
                .map(([key, ref]) => (
                  <RefeicaoDetail key={key} refeicao={ref as Refeicao} label={REFEICOES_LABEL[key] || key}
                    onSwap={setTargetData ? (pref) => substituirRefeicao(data, setTargetData, dia, key, pref) : undefined} />
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
        <CalendarDays className="h-6 w-6 md:h-7 md:w-7 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Meu Cardápio</h1>
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
                <Label className="text-base font-semibold">Qual é o seu objetivo?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {OBJETIVOS.map(o => (
                    <OptionButton key={o.value} selected={prefs.objetivo === o.value} onClick={() => setPrefs(p => ({ ...p, objetivo: o.value }))} label={o.label} desc={o.desc} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Orçamento semanal</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ORCAMENTOS.map(o => (
                    <OptionButton key={o.value} selected={prefs.orcamento === o.value} onClick={() => setPrefs(p => ({ ...p, orcamento: o.value }))} label={o.label} desc={o.desc} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Para quantas pessoas?</Label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5"].map(n => (
                    <button key={n} type="button" onClick={() => setPrefs(p => ({ ...p, pessoas: n }))}
                      className={`h-10 w-10 rounded-full border-2 font-semibold text-sm transition-all ${prefs.pessoas === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
                      {n}
                    </button>
                  ))}
                  <Input type="number" min="1" placeholder="Outro" className="w-20 h-10"
                    value={Number(prefs.pessoas) > 5 ? prefs.pessoas : ""}
                    onChange={e => setPrefs(p => ({ ...p, pessoas: e.target.value }))} />
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

              <div className="space-y-2">
                <Label className="text-base font-semibold">Deficiências nutricionais</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFICIENCIAS.map(d => (
                    <ChipButton key={d.value} selected={prefs.deficiencias.includes(d.value)} onClick={() => setPrefs(p => ({ ...p, deficiencias: toggleArray(p.deficiencias, d.value) }))} label={d.label} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-primary" /> O que você gosta de comer?
                </Label>
                <Textarea
                  placeholder="Ex: massas, saladas, frango grelhado, frutas tropicais..."
                  value={prefs.gosta}
                  onChange={e => setPrefs(p => ({ ...p, gosta: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-destructive" /> O que você não gosta de comer?
                </Label>
                <Textarea
                  placeholder="Ex: fígado, beterraba, quiabo, peixe cru..."
                  value={prefs.nao_gosta}
                  onChange={e => setPrefs(p => ({ ...p, nao_gosta: e.target.value }))}
                  rows={2}
                />
              </div>

              <Button onClick={gerarCardapio} disabled={loading} className="w-full sm:w-auto" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando cardápio...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Cardápio Semanal</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setShowList(!showList)}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> {showList ? "Ver Cardápio" : "Lista de Compras"}
                  </Button>
                  <Button variant="outline" onClick={salvarCardapio}>
                    <BookOpen className="mr-2 h-4 w-4" /> Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setCardapio(null)}>Novo Cardápio</Button>
                </div>
                <Button
                  onClick={() => openPdfDialog(cardapio)}
                  style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }}
                  className="hover:opacity-90"
                >
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
              </div>
              {renderCardapioView(cardapio, setCardapio)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salvos" className="space-y-4">
          {viewingSaved ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setViewingSaved(null)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
              </Button>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setShowList(!showList)}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> {showList ? "Ver Cardápio" : "Lista de Compras"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => openPdfDialog(viewingSaved.dados)}
                  style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }}
                  className="hover:opacity-90"
                >
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
              </div>
              {renderCardapioView(viewingSaved.dados, (d) => setViewingSaved({ ...viewingSaved, dados: d }))}
            </>
          ) : savedCardapios.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum cardápio salvo ainda.</p>
              <p className="text-sm mt-1">Gere um cardápio e clique em "Salvar".</p>
            </div>
          ) : (
            savedCardapios.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="cursor-pointer flex-1" onClick={() => setViewingSaved(c)}>
                  <p className="font-semibold text-foreground">Cardápio de {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
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

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar cardápio em PDF</DialogTitle>
            <DialogDescription>O que você deseja exportar?</DialogDescription>
          </DialogHeader>
          <RadioGroup value={pdfMode} onValueChange={(v) => setPdfMode(v as "dia" | "semana")} className="space-y-2 py-2">
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value="dia" id="pdf-dia" />
              <div>
                <p className="font-medium text-sm">Cardápio do Dia</p>
                <p className="text-xs text-muted-foreground">Apenas as refeições de hoje</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value="semana" id="pdf-semana" />
              <div>
                <p className="font-medium text-sm">Cardápio Semanal Completo</p>
                <p className="text-xs text-muted-foreground">Os 7 dias da semana</p>
              </div>
            </label>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmPdf} style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }} className="hover:opacity-90">
              Gerar PDF →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
