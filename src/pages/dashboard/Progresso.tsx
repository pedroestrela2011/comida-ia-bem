import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Zap, Plus, History, BarChart3, Trophy, Trash2 } from "lucide-react";
import { useDailyScore } from "@/hooks/useDailyScore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProgressRecord {
  id: string;
  peso: number | null;
  cintura: number | null;
  braco: number | null;
  quadril: number | null;
  perna: number | null;
  nivel_energia: string;
  frequencia_exercicios: number | null;
  qualidade_sono: string;
  observacoes: string | null;
  created_at: string;
}

const ENERGIA_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
const SONO_LABELS: Record<string, string> = { ruim: "Ruim", regular: "Regular", boa: "Boa", excelente: "Excelente" };
const ENERGIA_NUM: Record<string, number> = { baixo: 1, medio: 2, alto: 3 };
const SONO_NUM: Record<string, number> = { ruim: 1, regular: 2, boa: 3, excelente: 4 };

export default function Progresso() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("registro");
  const { registerAction } = useDailyScore();

  // Form state
  const [peso, setPeso] = useState("");
  const [cintura, setCintura] = useState("");
  const [braco, setBraco] = useState("");
  const [quadril, setQuadril] = useState("");
  const [perna, setPerna] = useState("");
  const [nivelEnergia, setNivelEnergia] = useState("medio");
  const [freqExercicios, setFreqExercicios] = useState("");
  const [qualidadeSono, setQualidadeSono] = useState("regular");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("progress_records")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setRecords(data as ProgressRecord[]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!peso) {
      toast({ title: "Preencha pelo menos o peso.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("progress_records").insert({
      user_id: user.id,
      peso: parseFloat(peso) || null,
      cintura: parseFloat(cintura) || null,
      braco: parseFloat(braco) || null,
      quadril: parseFloat(quadril) || null,
      perna: parseFloat(perna) || null,
      nivel_energia: nivelEnergia,
      frequencia_exercicios: parseInt(freqExercicios) || 0,
      qualidade_sono: qualidadeSono,
      observacoes: observacoes || null,
    });

    if (error) {
      toast({ title: "Erro ao salvar registro.", variant: "destructive" });
    } else {
      toast({ title: "Registro salvo com sucesso! 🎉" });
      await registerAction("progresso", 20, { action: "registro_progresso" });
      setPeso(""); setCintura(""); setBraco(""); setQuadril(""); setPerna("");
      setNivelEnergia("medio"); setFreqExercicios(""); setQualidadeSono("regular"); setObservacoes("");
      fetchRecords();
      setActiveTab("graficos");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("progress_records").delete().eq("id", id);
    if (!error) {
      toast({ title: "Registro removido." });
      fetchRecords();
    }
  };

  const isFirstRecord = records.length === 0;

  // Chart data
  const chartData = useMemo(() => records.map(r => ({
    date: format(new Date(r.created_at), "dd/MM", { locale: ptBR }),
    peso: r.peso,
    cintura: r.cintura,
    braco: r.braco,
    quadril: r.quadril,
    perna: r.perna,
    energia: ENERGIA_NUM[r.nivel_energia] || 2,
    exercicios: r.frequencia_exercicios || 0,
    sono: SONO_NUM[r.qualidade_sono] || 2,
  })), [records]);

  // Motivational feedback
  const feedback = useMemo(() => {
    if (records.length < 2) return [];
    const msgs: string[] = [];
    const first = records[0];
    const last = records[records.length - 1];

    if (first.peso && last.peso) {
      const diff = first.peso - last.peso;
      if (diff > 0) msgs.push(`Você perdeu ${diff.toFixed(1)} kg desde seu primeiro registro! 💪`);
      else if (diff < 0) msgs.push(`Você ganhou ${Math.abs(diff).toFixed(1)} kg desde seu primeiro registro.`);
      else msgs.push("Seu peso se manteve estável. Consistência é chave! 🔑");
    }

    const energiaFirst = ENERGIA_NUM[first.nivel_energia] || 2;
    const energiaLast = ENERGIA_NUM[last.nivel_energia] || 2;
    if (energiaLast > energiaFirst) msgs.push("Seu nível de energia aumentou! Sua rotina está funcionando. ⚡");
    if (energiaLast < energiaFirst) msgs.push("Seu nível de energia diminuiu. Revise seu descanso e alimentação. 🧘");

    if (first.frequencia_exercicios != null && last.frequencia_exercicios != null) {
      if (last.frequencia_exercicios > first.frequencia_exercicios)
        msgs.push("Você está se exercitando mais! Continue assim. 🏃");
    }

    const sonoFirst = SONO_NUM[first.qualidade_sono] || 2;
    const sonoLast = SONO_NUM[last.qualidade_sono] || 2;
    if (sonoLast > sonoFirst) msgs.push("Sua qualidade de sono melhorou! 😴✨");

    if (msgs.length === 0) msgs.push("Seu progresso mostra que sua rotina está funcionando. Continue! 🚀");
    return msgs;
  }, [records]);

  const pesoConfig = { peso: { label: "Peso (kg)", color: "hsl(var(--primary))" } };
  const medidasConfig = {
    cintura: { label: "Cintura", color: "hsl(var(--primary))" },
    braco: { label: "Braço", color: "hsl(var(--accent))" },
    quadril: { label: "Quadril", color: "hsl(142 40% 65%)" },
    perna: { label: "Perna", color: "hsl(35 55% 45%)" },
  };
  const exerciciosConfig = { exercicios: { label: "Exercícios/semana", color: "hsl(var(--primary))" } };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Rastreador de Progresso</h1>
        <p className="text-sm text-muted-foreground">Acompanhe sua evolução física e de saúde ao longo do tempo.</p>
      </div>

      {/* Motivational Feedback */}
      {feedback.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                {feedback.map((msg, i) => (
                  <p key={i} className="text-sm text-foreground">{msg}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registro" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{isFirstRecord ? "Primeiro Registro" : "Novo Registro"}</span>
            <span className="sm:hidden">Registro</span>
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center gap-1.5" disabled={records.length === 0}>
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gráficos</span>
            <span className="sm:hidden">Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1.5" disabled={records.length === 0}>
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* REGISTRO TAB */}
        <TabsContent value="registro" className="space-y-4 mt-4">
          {isFirstRecord && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <p className="text-sm text-foreground">
                  <strong>Bem-vindo ao Rastreador!</strong> Preencha seus dados iniciais para começar a acompanhar sua evolução.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isFirstRecord ? "Dados Iniciais" : "Novo Registro"}</CardTitle>
              <CardDescription>Preencha os campos abaixo. Apenas o peso é obrigatório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Peso */}
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input id="peso" type="number" step="0.1" placeholder="Ex: 75.5" value={peso} onChange={e => setPeso(e.target.value)} />
              </div>

              {/* Medidas */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Medidas corporais (cm)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cintura" className="text-xs text-muted-foreground">Cintura</Label>
                    <Input id="cintura" type="number" step="0.1" placeholder="cm" value={cintura} onChange={e => setCintura(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="braco" className="text-xs text-muted-foreground">Braço</Label>
                    <Input id="braco" type="number" step="0.1" placeholder="cm" value={braco} onChange={e => setBraco(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quadril" className="text-xs text-muted-foreground">Quadril</Label>
                    <Input id="quadril" type="number" step="0.1" placeholder="cm" value={quadril} onChange={e => setQuadril(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="perna" className="text-xs text-muted-foreground">Perna</Label>
                    <Input id="perna" type="number" step="0.1" placeholder="cm" value={perna} onChange={e => setPerna(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Energia & Sono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de energia</Label>
                  <Select value={nivelEnergia} onValueChange={setNivelEnergia}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">🔋 Baixo</SelectItem>
                      <SelectItem value="medio">⚡ Médio</SelectItem>
                      <SelectItem value="alto">🔥 Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qualidade do sono</Label>
                  <Select value={qualidadeSono} onValueChange={setQualidadeSono}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ruim">😴 Ruim</SelectItem>
                      <SelectItem value="regular">😐 Regular</SelectItem>
                      <SelectItem value="boa">😊 Boa</SelectItem>
                      <SelectItem value="excelente">🌟 Excelente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Frequência exercícios */}
              <div className="space-y-2">
                <Label htmlFor="freq">Frequência de exercícios (vezes por semana)</Label>
                <Input id="freq" type="number" min="0" max="14" placeholder="Ex: 3" value={freqExercicios} onChange={e => setFreqExercicios(e.target.value)} />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="obs">Observações (opcional)</Label>
                <Textarea id="obs" placeholder="Como você está se sentindo? Algo relevante?" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Salvando..." : isFirstRecord ? "Salvar Primeiro Registro" : "Registrar Progresso"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GRÁFICOS TAB */}
        <TabsContent value="graficos" className="space-y-4 mt-4">
          {records.length < 2 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Registre pelo menos 2 entradas para ver os gráficos de evolução.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Peso Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Evolução do Peso</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={pesoConfig} className="h-[250px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} domain={['auto', 'auto']} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="peso" stroke="var(--color-peso)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Medidas Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Medidas Corporais</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={medidasConfig} className="h-[250px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} domain={['auto', 'auto']} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="cintura" stroke="var(--color-cintura)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="braco" stroke="var(--color-braco)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="quadril" stroke="var(--color-quadril)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="perna" stroke="var(--color-perna)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Exercícios Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Frequência de Exercícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={exerciciosConfig} className="h-[200px] w-full">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="exercicios" fill="var(--color-exercicios)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* HISTÓRICO TAB */}
        <TabsContent value="historico" className="space-y-3 mt-4">
          {records.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Nenhum registro encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            [...records].reverse().map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {format(new Date(r.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {ENERGIA_LABELS[r.nivel_energia] || r.nivel_energia}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {r.peso && (
                      <div>
                        <span className="text-muted-foreground">Peso:</span>{" "}
                        <span className="font-medium">{r.peso} kg</span>
                      </div>
                    )}
                    {r.cintura && (
                      <div>
                        <span className="text-muted-foreground">Cintura:</span>{" "}
                        <span className="font-medium">{r.cintura} cm</span>
                      </div>
                    )}
                    {r.braco && (
                      <div>
                        <span className="text-muted-foreground">Braço:</span>{" "}
                        <span className="font-medium">{r.braco} cm</span>
                      </div>
                    )}
                    {r.quadril && (
                      <div>
                        <span className="text-muted-foreground">Quadril:</span>{" "}
                        <span className="font-medium">{r.quadril} cm</span>
                      </div>
                    )}
                    {r.perna && (
                      <div>
                        <span className="text-muted-foreground">Perna:</span>{" "}
                        <span className="font-medium">{r.perna} cm</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Exercícios:</span>{" "}
                      <span className="font-medium">{r.frequencia_exercicios || 0}x/sem</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sono:</span>{" "}
                      <span className="font-medium">{SONO_LABELS[r.qualidade_sono] || r.qualidade_sono}</span>
                    </div>
                  </div>

                  {r.observacoes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">"{r.observacoes}"</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
