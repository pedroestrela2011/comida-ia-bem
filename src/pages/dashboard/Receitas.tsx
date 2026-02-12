import { useState } from "react";
import { ChefHat, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Receita = {
  nome: string; descricao: string; tempo_preparo: string; porcoes: string;
  ingredientes: string[]; modo_preparo: string[]; dicas: string;
};

export default function Receitas() {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [receita, setReceita] = useState<Receita | null>(null);
  const [saved, setSaved] = useState<Receita[]>([]);

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
      toast({ title: "Receita criada! 🍳" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar receita", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const salvarReceita = () => {
    if (receita) {
      setSaved(prev => [receita, ...prev]);
      toast({ title: "Receita salva! 📚" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <ChefHat className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
      </div>

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

      {receita && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{receita.nome}</h2>
            <Button variant="outline" size="sm" onClick={salvarReceita}>Salvar</Button>
          </div>
          <p className="text-muted-foreground">{receita.descricao}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>⏱️ {receita.tempo_preparo}</span>
            <span>🍽️ {receita.porcoes}</span>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Ingredientes</h3>
            <ul className="space-y-1">
              {receita.ingredientes?.map((ing, i) => (
                <li key={i} className="text-sm flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{ing}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Modo de Preparo</h3>
            <ol className="space-y-2">
              {receita.modo_preparo?.map((step, i) => (
                <li key={i} className="text-sm flex gap-3">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>{step}
                </li>
              ))}
            </ol>
          </div>
          {receita.dicas && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">💡 <strong>Dica:</strong> {receita.dicas}</p>
            </div>
          )}
        </div>
      )}

      {saved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">📚 Receitas Salvas</h2>
          {saved.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setReceita(r)}>
              <p className="font-semibold text-foreground">{r.nome}</p>
              <p className="text-sm text-muted-foreground">{r.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
