import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDailyScore } from "@/hooks/useDailyScore";
import { useGamification } from "@/hooks/useGamification";
import {
  Loader2, UtensilsCrossed, Flame, Beef, Wheat, Droplets, Leaf, Apple, Sparkles, Star,
  Camera, X, ChefHat, Clock, Users, BookmarkPlus, Lightbulb,
} from "lucide-react";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";

interface ReceitaPrato {
  tempo_preparo: string;
  porcoes: string;
  dificuldade?: string;
  ingredientes: string[];
  modo_preparo: string[];
  dicas?: string;
}

interface Analise {
  nome_prato: string;
  macronutrientes: {
    calorias: string;
    proteinas: string;
    carboidratos: string;
    gorduras: string;
    fibras: string;
  };
  vitaminas: { nome: string; quantidade: string; beneficio: string }[];
  minerais: { nome: string; quantidade: string; beneficio: string }[];
  feedback: string[];
  pontuacao_saude: number;
  resumo: string;
  receita?: ReceitaPrato;
}

const RECEITAS_STORAGE_KEY = "saved_recipes_v1";

const difficultyVariant = (d?: string) => {
  if (!d) return "secondary" as const;
  const l = d.toLowerCase();
  if (l.includes("fácil") || l.includes("facil")) return "default" as const;
  if (l.includes("médio") || l.includes("medio")) return "secondary" as const;
  return "destructive" as const;
};

export default function AnalisadorPrato() {
  const [alimentos, setAlimentos] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { registerAction } = useDailyScore();

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPhotoPreview(base64);
      await identifyFoodsFromPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const identifyFoodsFromPhoto = async (imageBase64: string) => {
    setPhotoLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para usar esta funcionalidade.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "identificar_alimentos_foto", preferences: { image_base64: imageBase64 } },
      });

      if (error) throw error;

      const identified = data?.content?.trim() || "";
      if (identified && identified.toLowerCase() !== "não identificado") {
        setAlimentos((prev) => prev ? `${prev}\n${identified}` : identified);
        toast({ title: "Alimentos identificados na foto!", description: "Revise a lista e ajuste se necessário." });
      } else {
        toast({ title: "Não foi possível identificar alimentos na foto.", description: "Tente descrever manualmente.", variant: "destructive" });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao analisar foto.", description: e.message, variant: "destructive" });
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analisarPrato = async () => {
    if (!alimentos.trim()) {
      toast({ title: "Informe os alimentos do prato.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setAnalise(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para usar esta funcionalidade.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "analisador_prato", preferences: { alimentos: alimentos.trim() } },
      });

      if (error) throw error;

      const content = data?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");

      const parsed: Analise = JSON.parse(jsonMatch[0]);
      setAnalise(parsed);
      await registerAction("analisador", 15, { action: "analise_prato", prato: parsed.nome_prato });
      toast({ title: "Análise concluída!" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao analisar prato.", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const salvarReceita = () => {
    if (!analise?.receita) return;
    const r = analise.receita;
    const novaReceita = {
      nome: analise.nome_prato,
      descricao: analise.resumo,
      tempo_preparo: r.tempo_preparo,
      porcoes: r.porcoes,
      dificuldade: r.dificuldade,
      ingredientes: r.ingredientes,
      modo_preparo: r.modo_preparo,
      dicas: r.dicas || "",
      informacoes_nutricionais: {
        calorias: analise.macronutrientes.calorias,
        proteinas: analise.macronutrientes.proteinas,
        carboidratos: analise.macronutrientes.carboidratos,
        gorduras: analise.macronutrientes.gorduras,
        fibras: analise.macronutrientes.fibras,
      },
    };
    try {
      const raw = localStorage.getItem(RECEITAS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(novaReceita);
      localStorage.setItem(RECEITAS_STORAGE_KEY, JSON.stringify(list));
      toast({ title: "Receita salva!", description: "Acesse na aba Receitas." });
    } catch {
      toast({ title: "Não foi possível salvar a receita.", variant: "destructive" });
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Analisador de Prato
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descubra os nutrientes da sua refeição e receba feedback nutricional.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descreva seu prato</CardTitle>
          <CardDescription>
            Liste os alimentos da sua refeição ou envie uma foto do prato para identificação automática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo upload area */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
              className="gap-2"
            >
              {photoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Identificando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Enviar foto do prato
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground self-center">(opcional)</span>
          </div>

          {/* Photo preview */}
          {photoPreview && (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Foto do prato"
                className="w-40 h-40 object-cover rounded-lg border border-border"
              />
              <button
                onClick={removePhoto}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-80 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {photoLoading && (
                <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}

          <Textarea
            placeholder={"Ex:\narroz\nfrango grelhado\nfeijão\nsalada\nlegumes"}
            value={alimentos}
            onChange={(e) => setAlimentos(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <Button onClick={analisarPrato} disabled={loading || photoLoading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analisar Prato
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {analise && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Score + Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`text-4xl font-bold ${scoreColor(analise.pontuacao_saude)}`}>
                    {analise.pontuacao_saude}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Pontuação de Saúde</span>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < analise.pontuacao_saude ? "text-primary fill-primary" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{analise.nome_prato}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{analise.resumo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Macronutrientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {[
                  { label: "Calorias", value: analise.macronutrientes.calorias, icon: Flame, color: "text-orange-500" },
                  { label: "Proteínas", value: analise.macronutrientes.proteinas, icon: Beef, color: "text-red-500" },
                  { label: "Carboidratos", value: analise.macronutrientes.carboidratos, icon: Wheat, color: "text-amber-500" },
                  { label: "Gorduras", value: analise.macronutrientes.gorduras, icon: Droplets, color: "text-blue-500" },
                  { label: "Fibras", value: analise.macronutrientes.fibras, icon: Leaf, color: "text-green-500" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-bold text-foreground text-sm">{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vitamins & Minerals */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary" />
                  Vitaminas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analise.vitaminas.map((v, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
                      <span className="text-xs font-semibold bg-primary/10 text-primary rounded px-2 py-1 whitespace-nowrap">
                        {v.nome}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{v.quantidade}</p>
                        <p className="text-xs text-foreground">{v.beneficio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Minerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analise.minerais.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
                      <span className="text-xs font-semibold bg-primary/10 text-primary rounded px-2 py-1 whitespace-nowrap">
                        {m.nome}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{m.quantidade}</p>
                        <p className="text-xs text-foreground">{m.beneficio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Feedback Nutricional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analise.feedback.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary mt-0.5">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Receita */}
          {analise.receita && (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    Como preparar este prato
                  </CardTitle>
                  <FavoriteButton
                    recipe={{
                      nome: analise.nome_prato,
                      descricao: analise.resumo,
                      tempo_preparo: analise.receita.tempo_preparo,
                      porcoes: analise.receita.porcoes,
                      dificuldade: analise.receita.dificuldade,
                      ingredientes: analise.receita.ingredientes,
                      modo_preparo: analise.receita.modo_preparo,
                      dicas: analise.receita.dicas,
                      informacoes_nutricionais: {
                        calorias: analise.macronutrientes.calorias,
                        proteinas: analise.macronutrientes.proteinas,
                        carboidratos: analise.macronutrientes.carboidratos,
                        gorduras: analise.macronutrientes.gorduras,
                        fibras: analise.macronutrientes.fibras,
                      },
                    }}
                    origem="analisador_prato"
                  />
                </div>
                <CardDescription>Receita sugerida com base na análise do prato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3 text-sm">
                  {analise.receita.tempo_preparo && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" /> {analise.receita.tempo_preparo}
                    </div>
                  )}
                  {analise.receita.porcoes && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" /> {analise.receita.porcoes}
                    </div>
                  )}
                  {analise.receita.dificuldade && (
                    <Badge variant={difficultyVariant(analise.receita.dificuldade)}>
                      {analise.receita.dificuldade}
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Ingredientes</h3>
                  <ul className="space-y-1.5">
                    {analise.receita.ingredientes.map((ing, i) => (
                      <li key={i} className="text-sm flex items-center gap-2 text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Modo de preparo</h3>
                  <ol className="space-y-3">
                    {analise.receita.modo_preparo.map((step, i) => (
                      <li key={i} className="text-sm flex gap-3 text-foreground">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {analise.receita.dicas && (
                  <div className="rounded-lg bg-muted p-3 flex gap-2">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      <strong>Dica:</strong> {analise.receita.dicas}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
