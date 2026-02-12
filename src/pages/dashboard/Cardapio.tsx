import { useState } from "react";
import { CalendarDays, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function Cardapio() {
  const [loading, setLoading] = useState(false);
  const [cardapio, setCardapio] = useState<CardapioData | null>(null);
  const [showList, setShowList] = useState(false);
  const [prefs, setPrefs] = useState({
    objetivo: "", orcamento: "", pessoas: "1", preferencias: "", restricoes: "", deficiencias: "",
  });

  const gerarCardapio = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type: "cardapio", preferences: prefs },
      });
      if (error) throw error;
      const content = data.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");
      const parsed = JSON.parse(jsonMatch[0]) as CardapioData;
      setCardapio(parsed);
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
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Suas preferências</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Objetivo</Label>
              <Input placeholder="Ex: Emagrecer, ganhar massa..." value={prefs.objetivo} onChange={e => setPrefs(p => ({ ...p, objetivo: e.target.value }))} />
            </div>
            <div>
              <Label>Orçamento semanal</Label>
              <Input placeholder="Ex: R$200, econômico..." value={prefs.orcamento} onChange={e => setPrefs(p => ({ ...p, orcamento: e.target.value }))} />
            </div>
            <div>
              <Label>Nº de pessoas</Label>
              <Input type="number" min="1" value={prefs.pessoas} onChange={e => setPrefs(p => ({ ...p, pessoas: e.target.value }))} />
            </div>
            <div>
              <Label>Restrições alimentares</Label>
              <Input placeholder="Ex: Sem glúten, vegetariano..." value={prefs.restricoes} onChange={e => setPrefs(p => ({ ...p, restricoes: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Preferências</Label>
              <Textarea placeholder="Alimentos que gosta, cozinha favorita..." value={prefs.preferencias} onChange={e => setPrefs(p => ({ ...p, preferencias: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Deficiências nutricionais</Label>
              <Input placeholder="Ex: Vitamina D, ferro..." value={prefs.deficiencias} onChange={e => setPrefs(p => ({ ...p, deficiencias: e.target.value }))} />
            </div>
          </div>
          <Button onClick={gerarCardapio} disabled={loading} className="w-full sm:w-auto">
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
