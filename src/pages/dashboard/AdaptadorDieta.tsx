import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";
import {
  FileText, Image as ImageIcon, ClipboardPaste, Sparkles, Loader2, Save,
  ShoppingBasket, AlertTriangle, Wand2, ChefHat, Clock, Trash2, X, CheckCircle2,
  Pencil, Plus, CalendarPlus, ArrowLeft, CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// pdfjs client-side text extraction
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore vite worker import
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

type SourceType = "text" | "image" | "pdf";

interface AdaptedResult {
  plano_original?: {
    resumo?: string;
    objetivos?: string[];
    restricoes_identificadas?: string[];
    refeicoes?: { nome: string; horario_original?: string; itens?: { alimento: string; quantidade: string }[] }[];
  };
  plano_adaptado?: {
    resumo?: string;
    refeicoes?: {
      nome: string;
      horario?: string;
      itens?: { alimento: string; quantidade: string }[];
      receita?: {
        nome: string;
        tempo_preparo?: string;
        dificuldade?: string;
        ingredientes?: string[];
        modo_preparo?: string[];
        beneficios?: string;
      };
      substituicoes_feitas?: string[];
    }[];
  };
  lista_compras?: {
    semanal?: Record<string, string[]>;
    mensal_estoque?: string[];
  };
  dificuldades_originais?: { ponto: string; solucao: string }[];
  compatibilidade?: { pontuacao: number; justificativa: string };
}

const CATEGORIA_LABELS: Record<string, string> = {
  proteinas: "Proteínas",
  hortifruti: "Hortifruti",
  laticinios: "Laticínios",
  graos_e_cereais: "Grãos e cereais",
  temperos: "Temperos",
  outros: "Outros",
};

export default function AdaptadorDieta() {
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [horarios, setHorarios] = useState("");
  const [gosta, setGosta] = useState("");
  const [naoGosta, setNaoGosta] = useState("");
  const [alergias, setAlergias] = useState("");
  const [rotina, setRotina] = useState("");
  const [tempoCozinhar, setTempoCozinhar] = useState("");
  const [orcamento, setOrcamento] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdaptedResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const [tab, setTab] = useState("nova");
  const navigate = useNavigate();

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("adapted_diets" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSaved((data as any) || []);
  };

  const handleFile = async (f: File) => {
    setFileName(f.name);
    if (f.type === "application/pdf") {
      setSourceType("pdf");
      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(f);

      // Extract text client-side too to help IA
      try {
        setExtracting(true);
        const buf = await f.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
        let full = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const txt = await page.getTextContent();
          full += txt.items.map((it: any) => it.str).join(" ") + "\n\n";
        }
        if (full.trim()) setTextContent(full.trim());
      } catch (e) {
        console.warn("PDF text extraction failed, will send file as attachment", e);
      } finally { setExtracting(false); }
    } else if (f.type.startsWith("image/")) {
      setSourceType("image");
      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      toast({ title: "Formato não suportado. Envie PDF, imagem ou cole o texto.", variant: "destructive" });
    }
  };

  const clearFile = () => {
    setFileName(""); setFileDataUrl(""); if (fileRef.current) fileRef.current.value = "";
    if (sourceType !== "text") setSourceType("text");
  };

  const canSubmit = useMemo(() => {
    if (sourceType === "text") return textContent.trim().length > 20;
    return !!fileDataUrl;
  }, [sourceType, textContent, fileDataUrl]);

  const adaptar = async () => {
    if (!canSubmit) {
      toast({ title: "Envie ou cole o plano alimentar antes de continuar.", variant: "destructive" });
      return;
    }
    setLoading(true); setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Faça login para usar esta funcionalidade.", variant: "destructive" }); return; }

      // Prefer text (works best). If PDF and we have extracted text, send text + also attach file.
      let source: any;
      if (sourceType === "text" || (sourceType === "pdf" && textContent.trim())) {
        source = { type: "text", content: textContent.trim() };
      } else if (sourceType === "image") {
        source = { type: "image", content: fileDataUrl };
      } else {
        source = { type: "pdf", content: fileDataUrl, filename: fileName };
      }

      const { data, error } = await supabase.functions.invoke("adaptar-dieta", {
        body: {
          source,
          personalization: {
            horarios, gosta, nao_gosta: naoGosta, alergias,
            rotina, tempo_cozinhar: tempoCozinhar, orcamento,
          },
        },
      });
      if (error) throw error;

      const content: string = data?.content || "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Resposta inválida da IA");
      const parsed: AdaptedResult = JSON.parse(match[0]);
      setResult(parsed);
      toast({ title: "Dieta adaptada com sucesso!" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao adaptar dieta.", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const salvar = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const titulo = result.plano_adaptado?.resumo?.slice(0, 80) || "Dieta adaptada";
      const { error } = await supabase.from("adapted_diets" as any).insert({
        user_id: user.id,
        titulo,
        source_type: sourceType,
        personalization: { horarios, gosta, nao_gosta: naoGosta, alergias, rotina, tempo_cozinhar: tempoCozinhar, orcamento },
        resultado: result,
        compatibilidade: result.compatibilidade?.pontuacao ?? null,
      });
      if (error) throw error;
      toast({ title: "Dieta adaptada salva!" });
      await loadSaved();
    } catch (e: any) {
      toast({ title: "Erro ao salvar.", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const excluirSalva = async (id: string) => {
    const { error } = await supabase.from("adapted_diets" as any).delete().eq("id", id);
    if (error) return toast({ title: "Erro ao excluir.", variant: "destructive" });
    setSaved((s) => s.filter((r) => r.id !== id));
  };

  const converterEmCardapio = async () => {
    if (!result?.plano_adaptado) return;
    setConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const dados = {
        titulo: result.plano_adaptado.resumo?.slice(0, 80) || "Dieta adaptada",
        origem: "adaptador_dieta",
        refeicoes: (result.plano_adaptado.refeicoes || []).map((r) => ({
          nome: r.nome,
          horario: r.horario,
          itens: r.itens || [],
          receita: r.receita || null,
        })),
      };
      const { error } = await supabase.from("cardapios_salvos").insert({
        user_id: user.id,
        tipo: "adaptado",
        dados,
      });
      if (error) throw error;
      toast({ title: "Cardápio criado! Abrindo em Meu Cardápio..." });
      navigate("/dashboard/cardapio");
    } catch (e: any) {
      toast({ title: "Erro ao criar cardápio.", description: e.message, variant: "destructive" });
    } finally { setConverting(false); }
  };

  const [adding, setAdding] = useState(false);

  const adicionarAoMeuCardapio = async (semanas: number) => {
    if (!result?.plano_adaptado?.refeicoes?.length) return;
    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
      const SLOT_ORDER = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"];
      const parseHour = (h?: string): number | null => {
        if (!h) return null;
        const m = h.match(/(\d{1,2})/);
        return m ? parseInt(m[1], 10) : null;
      };
      const slotFromHour = (h?: string): string => {
        const n = parseHour(h);
        if (n === null) return "lanche_tarde";
        if (n < 10) return "cafe_da_manha";
        if (n < 12) return "lanche_manha";
        if (n < 15) return "almoco";
        if (n < 18) return "lanche_tarde";
        return "jantar";
      };
      const toRefeicao = (r: any) => {
        const rec = r.receita || {};
        const ingFromItens = (r.itens || []).map((i: any) => `${i.alimento}${i.quantidade ? ` — ${i.quantidade}` : ""}`);
        return {
          nome: rec.nome || r.nome || "Refeição",
          descricao: rec.beneficios || (r.substituicoes_feitas?.join(" · ") ?? ""),
          ingredientes: (rec.ingredientes && rec.ingredientes.length ? rec.ingredientes : ingFromItens),
          modo_preparo: rec.modo_preparo || [],
          tempo_preparo: rec.tempo_preparo || "",
          dificuldade: rec.dificuldade || "",
          dicas: r.horario ? `Horário sugerido: ${r.horario}` : undefined,
        };
      };

      // Build one day of meals from adapted diet
      const refeicoes = result.plano_adaptado.refeicoes;
      const diaBase: Record<string, any> = {};
      const usedSlots = new Set<string>();
      refeicoes.forEach((r, idx) => {
        let slot = slotFromHour(r.horario);
        if (usedSlots.has(slot)) {
          // fallback to first free ordered slot
          slot = SLOT_ORDER.find((s) => !usedSlots.has(s)) || `refeicao_extra_${idx}`;
        }
        usedSlots.add(slot);
        diaBase[slot] = toRefeicao(r);
      });

      const cardapio: Record<string, any> = {};
      DIAS.forEach((d) => { cardapio[d] = { ...diaBase }; });

      const listaCompras: string[] = [];
      const semanal = result.lista_compras?.semanal || {};
      Object.values(semanal).forEach((arr: any) => Array.isArray(arr) && listaCompras.push(...arr));

      const tituloBase = result.plano_adaptado.resumo?.slice(0, 60) || "Dieta adaptada";
      const rows = Array.from({ length: semanas }).map((_, i) => ({
        user_id: user.id,
        tipo: "normal" as const,
        dados: {
          cardapio,
          lista_compras: listaCompras,
          titulo: `Semana ${i + 1} · ${tituloBase}`,
          origem: "adaptador_dieta",
        } as any,
      }));

      const { error } = await supabase.from("cardapios_salvos").insert(rows);
      if (error) throw error;
      toast({ title: `${semanas} ${semanas === 1 ? "semana adicionada" : "semanas adicionadas"} ao seu cardápio!` });
      navigate("/dashboard/cardapio");
    } catch (e: any) {
      toast({ title: "Erro ao adicionar ao cardápio.", description: e.message, variant: "destructive" });
    } finally { setAdding(false); }

  const scoreColor = (n?: number) => !n ? "text-muted-foreground" : n >= 85 ? "text-green-600" : n >= 65 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Wand2 className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Adaptador Inteligente de Dietas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie o plano do seu nutricionista e receba uma versão adaptada à sua rotina, mantendo os objetivos.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nova">Nova adaptação</TabsTrigger>
          <TabsTrigger value="salvas">Minhas dietas ({saved.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6 mt-4">
          {/* Etapa 1 - Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Envie o plano alimentar</CardTitle>
              <CardDescription>PDF, imagem, captura de tela ou cole o texto abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Button type="button" variant="outline" onClick={() => { setSourceType("pdf"); fileRef.current?.click(); }}>
                  <FileText className="mr-2 h-4 w-4" /> Enviar PDF
                </Button>
                <Button type="button" variant="outline" onClick={() => { setSourceType("image"); fileRef.current?.click(); }}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Enviar imagem
                </Button>
                <Button type="button" variant={sourceType === "text" ? "default" : "outline"} onClick={() => { clearFile(); setSourceType("text"); }}>
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Colar texto
                </Button>
              </div>

              {fileName && (
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {sourceType === "pdf" ? <FileText className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                  <span className="flex-1 truncate">{fileName}</span>
                  {extracting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <button onClick={clearFile} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              )}

              {sourceType === "image" && fileDataUrl && (
                <img src={fileDataUrl} alt="Prévia" className="max-h-56 rounded-lg border" />
              )}

              <div>
                <Label className="text-sm">Texto do plano (opcional se enviou arquivo, mas ajuda na precisão)</Label>
                <Textarea
                  placeholder="Cole aqui o plano alimentar exatamente como você recebeu do nutricionista..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="mt-1 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Etapa 2 - Personalização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Personalize à sua rotina</CardTitle>
              <CardDescription>Quanto mais detalhes, melhor a adaptação.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Horários que costuma comer</Label><Input placeholder="ex: 7h, 12h, 16h, 20h" value={horarios} onChange={(e) => setHorarios(e.target.value)} /></div>
              <div><Label>Rotina de trabalho / estudo</Label><Input placeholder="ex: escritório 9h-18h, treino 19h" value={rotina} onChange={(e) => setRotina(e.target.value)} /></div>
              <div><Label>Alimentos que gosta</Label><Input placeholder="ex: frango, ovo, batata doce" value={gosta} onChange={(e) => setGosta(e.target.value)} /></div>
              <div><Label>Alimentos que NÃO gosta</Label><Input placeholder="ex: brócolis, peixe" value={naoGosta} onChange={(e) => setNaoGosta(e.target.value)} /></div>
              <div><Label>Alergias / restrições</Label><Input placeholder="ex: lactose, glúten" value={alergias} onChange={(e) => setAlergias(e.target.value)} /></div>
              <div><Label>Tempo para cozinhar</Label><Input placeholder="ex: pouco, 20min por refeição" value={tempoCozinhar} onChange={(e) => setTempoCozinhar(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Orçamento mensal para alimentação</Label><Input placeholder="ex: R$ 600, moderado, alto" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Button size="lg" onClick={adaptar} disabled={loading || !canSubmit} className="w-full sm:w-auto">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adaptando dieta...</> : <><Sparkles className="mr-2 h-4 w-4" /> Adaptar minha dieta</>}
          </Button>

          {result && !editing && (
            <AdaptedResultView
              result={result}
              onSalvar={salvar}
              saving={saving}
              scoreColor={scoreColor}
              onEditar={() => setEditing(true)}
              onConverter={converterEmCardapio}
              converting={converting}
            />
          )}
          {result && editing && (
            <AdaptedDietEditor
              result={result}
              onCancel={() => setEditing(false)}
              onApply={(updated) => { setResult(updated); setEditing(false); toast({ title: "Ajustes aplicados." }); }}
            />
          )}
        </TabsContent>

        <TabsContent value="salvas" className="space-y-4 mt-4">
          {saved.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Você ainda não salvou nenhuma dieta adaptada.</CardContent></Card>
          )}
          {saved.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{s.titulo}</CardTitle>
                    <CardDescription>{new Date(s.created_at).toLocaleDateString("pt-BR")} · Compatibilidade {s.compatibilidade ?? "-"}%</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => excluirSalva(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" onClick={() => { setResult(s.resultado); setTab("nova"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  Ver dieta adaptada
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdaptedResultView({ result, onSalvar, saving, scoreColor, onEditar, onConverter, converting }: {
  result: AdaptedResult; onSalvar: () => void; saving: boolean; scoreColor: (n?: number) => string;
  onEditar: () => void; onConverter: () => void; converting: boolean;
}) {
  const comp = result.compatibilidade;
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Compatibilidade */}
      {comp && (
        <Card className="border-primary/40">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-5">
            <div className={`text-5xl font-bold ${scoreColor(comp.pontuacao)}`}>{comp.pontuacao}%</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-foreground">Compatibilidade com sua rotina</p>
              <p className="text-sm text-muted-foreground mt-1">{comp.justificativa}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações principais - Revisar / Salvar / Transformar */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Revise e ajuste horários, quantidades e substituições antes de salvar ou transformar em cardápio.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onEditar}>
              <Pencil className="mr-2 h-4 w-4" /> Revisar e ajustar
            </Button>
            <Button variant="secondary" onClick={onSalvar} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando</> : <><Save className="mr-2 h-4 w-4" /> Salvar dieta</>}
            </Button>
            <Button onClick={onConverter} disabled={converting}>
              {converting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Convertendo</> : <><CalendarPlus className="mr-2 h-4 w-4" /> Transformar em cardápio</>}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Comparação Original x Adaptado */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Plano original</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {result.plano_original?.resumo && <p className="text-muted-foreground">{result.plano_original.resumo}</p>}
            {result.plano_original?.objetivos && result.plano_original.objetivos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.plano_original.objetivos.map((o, i) => <Badge key={i} variant="secondary">{o}</Badge>)}
              </div>
            )}
            {result.plano_original?.refeicoes?.map((r, i) => (
              <div key={i} className="border-t pt-2">
                <p className="font-medium">{r.nome} {r.horario_original && <span className="text-xs text-muted-foreground">· {r.horario_original}</span>}</p>
                <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4">
                  {r.itens?.map((it, j) => <li key={j}>{it.alimento} — {it.quantidade}</li>)}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Plano adaptado</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {result.plano_adaptado?.resumo && <p className="text-muted-foreground">{result.plano_adaptado.resumo}</p>}
            {result.plano_adaptado?.refeicoes?.map((r, i) => (
              <div key={i} className="border-t pt-2">
                <p className="font-medium">{r.nome} {r.horario && <span className="text-xs text-muted-foreground">· {r.horario}</span>}</p>
                <ul className="mt-1 text-xs text-foreground list-disc pl-4">
                  {r.itens?.map((it, j) => <li key={j}>{it.alimento} — {it.quantidade}</li>)}
                </ul>
                {r.substituicoes_feitas && r.substituicoes_feitas.length > 0 && (
                  <div className="mt-1 text-xs text-primary/80">
                    {r.substituicoes_feitas.map((s, j) => <p key={j}>✎ {s}</p>)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Receitas por refeição */}
      {result.plano_adaptado?.refeicoes?.some((r) => r.receita) && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ChefHat className="h-5 w-5 text-primary" /> Receitas sugeridas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {result.plano_adaptado.refeicoes.filter((r) => r.receita).map((r, i) => {
              const rec = r.receita!;
              return (
                <Card key={i} className="border-muted">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">{r.nome}</p>
                        <CardTitle className="text-base">{rec.nome}</CardTitle>
                      </div>
                      <FavoriteButton
                        recipe={{
                          nome: rec.nome,
                          descricao: rec.beneficios || "",
                          tempo_preparo: rec.tempo_preparo || "",
                          porcoes: "",
                          dificuldade: rec.dificuldade,
                          ingredientes: rec.ingredientes || [],
                          modo_preparo: rec.modo_preparo || [],
                          dicas: rec.beneficios,
                        }}
                        origem="analisador_prato"
                        size="sm"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {rec.tempo_preparo && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {rec.tempo_preparo}</span>}
                      {rec.dificuldade && <Badge variant="secondary" className="text-xs">{rec.dificuldade}</Badge>}
                    </div>
                    {rec.ingredientes && rec.ingredientes.length > 0 && (
                      <div>
                        <p className="font-medium text-xs">Ingredientes</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4">{rec.ingredientes.map((x, j) => <li key={j}>{x}</li>)}</ul>
                      </div>
                    )}
                    {rec.modo_preparo && rec.modo_preparo.length > 0 && (
                      <div>
                        <p className="font-medium text-xs">Modo de preparo</p>
                        <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-0.5">{rec.modo_preparo.map((x, j) => <li key={j}>{x}</li>)}</ol>
                      </div>
                    )}
                    {rec.beneficios && <p className="text-xs text-primary/80">✦ {rec.beneficios}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Lista de compras */}
      {result.lista_compras && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShoppingBasket className="h-5 w-5 text-primary" /> Lista de compras</CardTitle>
            <CardDescription>Organizada por categoria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.lista_compras.semanal && (
              <div>
                <p className="font-medium text-sm mb-2">Semanal</p>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(result.lista_compras.semanal).map(([cat, itens]) => (
                    itens && itens.length > 0 && (
                      <div key={cat} className="rounded-md border bg-muted/30 p-3">
                        <p className="text-xs font-semibold text-foreground mb-1">{CATEGORIA_LABELS[cat] || cat}</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {itens.map((it, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary/60" /> {it}</li>)}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            {result.lista_compras.mensal_estoque && result.lista_compras.mensal_estoque.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Estoque mensal</p>
                <div className="flex flex-wrap gap-1">
                  {result.lista_compras.mensal_estoque.map((it, i) => <Badge key={i} variant="outline">{it}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dificuldades identificadas */}
      {result.dificuldades_originais && result.dificuldades_originais.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Pontos difíceis do plano original</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {result.dificuldades_originais.map((d, i) => (
              <div key={i} className="text-sm border-l-2 border-yellow-500/60 pl-3">
                <p className="font-medium">{d.ponto}</p>
                <p className="text-muted-foreground text-xs mt-0.5">✓ {d.solucao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdaptedDietEditor({ result, onCancel, onApply }: {
  result: AdaptedResult;
  onCancel: () => void;
  onApply: (updated: AdaptedResult) => void;
}) {
  const [draft, setDraft] = useState<AdaptedResult>(() => JSON.parse(JSON.stringify(result)));
  const refeicoes = draft.plano_adaptado?.refeicoes || [];

  const updateMeal = (idx: number, patch: any) => {
    setDraft((d) => {
      const next = { ...d, plano_adaptado: { ...d.plano_adaptado, refeicoes: [...(d.plano_adaptado?.refeicoes || [])] } };
      next.plano_adaptado!.refeicoes![idx] = { ...next.plano_adaptado!.refeicoes![idx], ...patch };
      return next;
    });
  };
  const updateItem = (mIdx: number, iIdx: number, patch: any) => {
    const itens = [...(refeicoes[mIdx].itens || [])];
    itens[iIdx] = { ...itens[iIdx], ...patch };
    updateMeal(mIdx, { itens });
  };
  const addItem = (mIdx: number) => updateMeal(mIdx, { itens: [...(refeicoes[mIdx].itens || []), { alimento: "", quantidade: "" }] });
  const removeItem = (mIdx: number, iIdx: number) => updateMeal(mIdx, { itens: (refeicoes[mIdx].itens || []).filter((_, i) => i !== iIdx) });
  const updateSub = (mIdx: number, sIdx: number, val: string) => {
    const subs = [...(refeicoes[mIdx].substituicoes_feitas || [])];
    subs[sIdx] = val;
    updateMeal(mIdx, { substituicoes_feitas: subs });
  };
  const addSub = (mIdx: number) => updateMeal(mIdx, { substituicoes_feitas: [...(refeicoes[mIdx].substituicoes_feitas || []), ""] });
  const removeSub = (mIdx: number, sIdx: number) => updateMeal(mIdx, { substituicoes_feitas: (refeicoes[mIdx].substituicoes_feitas || []).filter((_, i) => i !== sIdx) });
  const addMeal = () => setDraft((d) => ({
    ...d,
    plano_adaptado: {
      ...d.plano_adaptado,
      refeicoes: [...(d.plano_adaptado?.refeicoes || []), { nome: "Nova refeição", horario: "", itens: [], substituicoes_feitas: [] }],
    },
  }));
  const removeMeal = (idx: number) => setDraft((d) => ({
    ...d,
    plano_adaptado: { ...d.plano_adaptado, refeicoes: (d.plano_adaptado?.refeicoes || []).filter((_, i) => i !== idx) },
  }));

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <Card className="border-primary/40">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" /> Revisar e ajustar</CardTitle>
            <CardDescription>Ajuste horários, quantidades e substituições. Clique em "Aplicar ajustes" para confirmar.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</Button>
            <Button onClick={() => onApply(draft)}><CheckCircle2 className="mr-2 h-4 w-4" /> Aplicar ajustes</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Resumo do plano adaptado</Label>
          <Textarea
            value={draft.plano_adaptado?.resumo || ""}
            onChange={(e) => setDraft((d) => ({ ...d, plano_adaptado: { ...d.plano_adaptado, resumo: e.target.value } }))}
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {refeicoes.map((r, mIdx) => (
          <Card key={mIdx}>
            <CardHeader className="pb-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto] items-end">
                <div>
                  <Label className="text-xs">Nome da refeição</Label>
                  <Input value={r.nome || ""} onChange={(e) => updateMeal(mIdx, { nome: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Horário</Label>
                  <Input placeholder="07:30" value={r.horario || ""} onChange={(e) => updateMeal(mIdx, { horario: e.target.value })} />
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeMeal(mIdx)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Itens (alimento · quantidade)</Label>
                  <Button size="sm" variant="outline" onClick={() => addItem(mIdx)}><Plus className="mr-1 h-3 w-3" /> Item</Button>
                </div>
                {(r.itens || []).map((it, iIdx) => (
                  <div key={iIdx} className="grid gap-2 grid-cols-[1fr_120px_auto]">
                    <Input placeholder="Alimento" value={it.alimento} onChange={(e) => updateItem(mIdx, iIdx, { alimento: e.target.value })} />
                    <Input placeholder="Qtd" value={it.quantidade} onChange={(e) => updateItem(mIdx, iIdx, { quantidade: e.target.value })} />
                    <Button size="sm" variant="ghost" onClick={() => removeItem(mIdx, iIdx)} className="text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {(!r.itens || r.itens.length === 0) && <p className="text-xs text-muted-foreground">Nenhum item.</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Substituições feitas</Label>
                  <Button size="sm" variant="outline" onClick={() => addSub(mIdx)}><Plus className="mr-1 h-3 w-3" /> Substituição</Button>
                </div>
                {(r.substituicoes_feitas || []).map((s, sIdx) => (
                  <div key={sIdx} className="flex gap-2">
                    <Input value={s} onChange={(e) => updateSub(mIdx, sIdx, e.target.value)} placeholder="ex: troquei aveia por tapioca" />
                    <Button size="sm" variant="ghost" onClick={() => removeSub(mIdx, sIdx)} className="text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={addMeal} className="w-full"><Plus className="mr-2 h-4 w-4" /> Adicionar refeição</Button>
      </div>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onApply(draft)}><CheckCircle2 className="mr-2 h-4 w-4" /> Aplicar ajustes</Button>
      </div>
    </div>
  );
}
