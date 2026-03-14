import { useState } from "react";
import { ChefHat, Loader2, Sparkles, Clock, Users, BookOpen, Flame, Dumbbell, Wheat, Droplets, Salad, BarChart3, Lightbulb, BookmarkPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type Receita = {
  nome: string; descricao: string; tempo_preparo: string; porcoes: string;
  dificuldade?: string; ingredientes: string[]; modo_preparo: string[]; dicas: string;
  informacoes_nutricionais?: { calorias?: string; proteinas?: string; carboidratos?: string; gorduras?: string; fibras?: string };
};

const difficultyColor = (d?: string) => {
  if (!d) return "secondary";
  const l = d.toLowerCase();
  if (l.includes("fácil") || l.includes("facil")) return "default" as const;
  if (l.includes("médio") || l.includes("medio")) return "secondary" as const;
  return "destructive" as const;
};

function ReceitaDetail({ receita, onSave }: { receita: Receita; onSave?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{receita.nome}</h2>
          <p className="text-muted-foreground text-sm mt-1">{receita.descricao}</p>
        </div>
        {onSave && (
          <Button variant="outline" size="sm" onClick={onSave} className="shrink-0">
            <BookmarkPlus className="mr-1.5 h-4 w-4" /> Salvar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {receita.tempo_preparo && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" /> {receita.tempo_preparo}
          </div>
        )}
        {receita.porcoes && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" /> {receita.porcoes}
          </div>
        )}
        {receita.dificuldade && (
          <Badge variant={difficultyColor(receita.dificuldade)}>{receita.dificuldade}</Badge>
        )}
      </div>

      {receita.informacoes_nutricionais && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" /> Informações Nutricionais
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            {receita.informacoes_nutricionais.calorias && (
              <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-500" /> {receita.informacoes_nutricionais.calorias}</div>
            )}
            {receita.informacoes_nutricionais.proteinas && (
              <div className="flex items-center gap-1.5"><Dumbbell className="h-3.5 w-3.5 text-red-500" /> {receita.informacoes_nutricionais.proteinas}</div>
            )}
            {receita.informacoes_nutricionais.carboidratos && (
              <div className="flex items-center gap-1.5"><Wheat className="h-3.5 w-3.5 text-amber-500" /> {receita.informacoes_nutricionais.carboidratos}</div>
            )}
            {receita.informacoes_nutricionais.gorduras && (
              <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-yellow-500" /> {receita.informacoes_nutricionais.gorduras}</div>
            )}
            {receita.informacoes_nutricionais.fibras && (
              <div className="flex items-center gap-1.5"><Salad className="h-3.5 w-3.5 text-green-500" /> {receita.informacoes_nutricionais.fibras}</div>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Ingredientes</h3>
        <ul className="space-y-1">
          {receita.ingredientes?.map((ing, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{ing}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Modo de Preparo</h3>
        <ol className="space-y-3">
          {receita.modo_preparo?.map((step, i) => (
            <li key={i} className="text-sm flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {receita.dicas && (
        <div className="rounded-lg bg-muted p-3 flex gap-2">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm"><strong>Dica:</strong> {receita.dicas}</p>
        </div>
      )}
    </div>
  );
}

export default function Receitas() {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [receita, setReceita] = useState<Receita | null>(null);
  const [saved, setSaved] = useState<Receita[]>([]);
  const [activeTab, setActiveTab] = useState("criar");
  const [viewingSaved, setViewingSaved] = useState<Receita | null>(null);

  const gerarReceita = async () => {
    if (!ingredients.trim()) { toast({ title: "Informe os ingredientes", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "receita", ingredients },
      });
      if (error) throw error;
      const content = data.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida");
      setReceita(JSON.parse(jsonMatch[0]) as Receita);
      toast({ title: "Receita criada!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar receita", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const salvarReceita = () => {
    if (receita) {
      setSaved(prev => [receita, ...prev]);
      toast({ title: "Receita salva!" });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 md:gap-3">
        <ChefHat className="h-6 w-6 md:h-7 md:w-7 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Receitas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criar" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Criar
          </TabsTrigger>
          <TabsTrigger value="salvas" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Salvas ({saved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Quais ingredientes você tem?</h2>
            <Textarea
              placeholder="Ex: frango, batata, cebola, alho, tomate..."
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              rows={3}
            />
            <Button onClick={gerarReceita} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando receita...</> : <><Sparkles className="mr-2 h-4 w-4" /> Criar Receita</>}
            </Button>
          </div>
          {receita && <ReceitaDetail receita={receita} onSave={salvarReceita} />}
        </TabsContent>

        <TabsContent value="salvas" className="space-y-4">
          {viewingSaved ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setViewingSaved(null)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
              </Button>
              <ReceitaDetail receita={viewingSaved} />
            </>
          ) : saved.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma receita salva ainda.</p>
              <p className="text-sm mt-1">Crie uma receita e clique em "Salvar".</p>
            </div>
          ) : (
            saved.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setViewingSaved(r)}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{r.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {r.tempo_preparo && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.tempo_preparo}</span>}
                    {r.dificuldade && <Badge variant={difficultyColor(r.dificuldade)} className="text-xs">{r.dificuldade}</Badge>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{r.descricao}</p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
