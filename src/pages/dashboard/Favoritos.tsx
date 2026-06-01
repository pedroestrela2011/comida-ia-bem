import { useMemo, useState } from "react";
import { Star, Search, Trash2, Clock, Users, Flame, ChefHat, ArrowLeft, BookOpen, Lightbulb, Wheat, Droplets, Salad, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites, FAVORITES_LIMIT, type FavoriteRecord } from "@/hooks/useFavorites";

const origemLabel: Record<string, string> = {
  receitas: "Receitas",
  cardapio: "Meu Cardápio",
  analisador_prato: "Analisador de Prato",
};

function RecipeFull({ rec, onBack, onRemove }: { rec: FavoriteRecord; onBack: () => void; onRemove: () => void }) {
  const d = rec.dados;
  const steps = Array.isArray(d.modo_preparo) ? d.modo_preparo : d.modo_preparo ? [d.modo_preparo] : [];
  const nut = d.informacoes_nutricionais;
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Button variant="outline" size="sm" onClick={onRemove}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Remover
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
          {d.foto ? (
            <img src={d.foto} alt={d.nome} className="h-full w-full object-cover" />
          ) : (
            <ChefHat className="h-14 w-14 text-primary/60" />
          )}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2 text-[10px]">{origemLabel[rec.origem] ?? rec.origem}</Badge>
            <h2 className="text-xl font-bold text-foreground">{d.nome}</h2>
            {d.descricao && <p className="text-sm text-muted-foreground mt-1">{d.descricao}</p>}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {d.tempo_preparo && <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" />{d.tempo_preparo}</div>}
            {d.porcoes && <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{d.porcoes}</div>}
            {d.dificuldade && <Badge variant="secondary">{d.dificuldade}</Badge>}
          </div>

          {nut && (
            <div className="rounded-lg border border-border p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {nut.calorias && <div className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{nut.calorias}</div>}
              {nut.proteinas && <div className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-red-500" />{nut.proteinas}</div>}
              {nut.carboidratos && <div className="flex items-center gap-1"><Wheat className="h-3 w-3 text-amber-500" />{nut.carboidratos}</div>}
              {nut.gorduras && <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-yellow-500" />{nut.gorduras}</div>}
              {nut.fibras && <div className="flex items-center gap-1"><Salad className="h-3 w-3 text-green-500" />{nut.fibras}</div>}
            </div>
          )}

          {d.ingredientes && d.ingredientes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Ingredientes</h3>
              <ul className="space-y-1">
                {d.ingredientes.map((i, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{i}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {steps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Modo de Preparo</h3>
              <ol className="space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="text-sm flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {d.dicas && (
            <div className="rounded-lg bg-muted p-3 flex gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm"><strong>Dica:</strong> {d.dicas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Favoritos() {
  const { items, loading, remove } = useFavorites();
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<FavoriteRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) =>
      f.nome.toLowerCase().includes(q) ||
      (f.dados.descricao || "").toLowerCase().includes(q) ||
      (f.dados.ingredientes || []).some((i) => i.toLowerCase().includes(q)),
    );
  }, [items, query]);

  if (viewing) {
    const current = items.find((i) => i.id === viewing.id) ?? viewing;
    return (
      <div className="max-w-3xl space-y-4 md:space-y-6">
        <RecipeFull
          rec={current}
          onBack={() => setViewing(null)}
          onRemove={async () => { const ok = await remove(current.id); if (ok) setViewing(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 md:h-7 md:w-7 text-yellow-500 fill-yellow-400" />
            Favoritos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sua biblioteca pessoal de receitas. {items.length}/{FAVORITES_LIMIT}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, ingrediente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Carregando favoritos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {items.length === 0 ? (
            <>
              <p className="font-medium text-foreground">Nenhuma receita favoritada ainda.</p>
              <p className="text-sm mt-1">Clique na estrela ⭐ em qualquer receita para salvá-la aqui.</p>
            </>
          ) : (
            <p>Nenhuma receita encontrada para "{query}".</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => {
            const d = f.dados;
            return (
              <button
                key={f.id}
                onClick={() => setViewing(f)}
                className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center relative">
                  {d.foto ? (
                    <img src={d.foto} alt={d.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <ChefHat className="h-10 w-10 text-primary/60 group-hover:scale-110 transition-transform" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(f.id); }}
                    aria-label="Remover dos favoritos"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 backdrop-blur border border-yellow-400 text-yellow-500 inline-flex items-center justify-center shadow-sm hover:scale-110 transition"
                  >
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm line-clamp-2 flex-1">{d.nome}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {d.informacoes_nutricionais?.calorias && (
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{d.informacoes_nutricionais.calorias}</span>
                    )}
                    {d.tempo_preparo && (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{d.tempo_preparo}</span>
                    )}
                    {d.porcoes && (
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{d.porcoes}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="secondary" className="text-[10px]">{origemLabel[f.origem] ?? f.origem}</Badge>
                    <span className="text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition">Ver receita →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
