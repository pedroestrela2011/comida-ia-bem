import { useEffect, useMemo, useState } from "react";
import { Inbox, ArrowLeft, Trash2, Clock, Users, Flame, ChefHat, Lightbulb, Wheat, Droplets, Salad, Dumbbell, Mail, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useReceivedRecipes, type ReceivedRecipe } from "@/hooks/useReceivedRecipes";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";
import { ShareRecipeButton } from "@/components/dashboard/ShareRecipeButton";

function Full({ rec, onBack, onRemove }: { rec: ReceivedRecipe; onBack: () => void; onRemove: () => void }) {
  const d = rec.dados;
  const { add } = useFavorites();
  const steps = Array.isArray(d.modo_preparo) ? d.modo_preparo : d.modo_preparo ? [d.modo_preparo] : [];
  const nut = d.informacoes_nutricionais;

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <FavoriteButton recipe={d} origem="receitas" />
          <ShareRecipeButton recipe={d} />
          <Button variant="outline" size="sm" onClick={onRemove}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-44 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
          {d.foto ? <img src={d.foto} alt={d.nome} className="h-full w-full object-cover" /> : <ChefHat className="h-14 w-14 text-primary/60" />}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2 text-[10px] gap-1">
              <Mail className="h-3 w-3" /> Recebida de {rec.sender_name || rec.sender_email || "usuário"}
            </Badge>
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

          <div className="pt-2 flex gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                const ok = await add(d, "receitas");
                if (ok) toast({ title: "Adicionada aos favoritos!" });
              }}
            >
              <BookmarkPlus className="mr-1.5 h-4 w-4" /> Salvar nos Favoritos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceitasRecebidas() {
  const { items, loading, markRead, remove } = useReceivedRecipes();
  const [viewing, setViewing] = useState<ReceivedRecipe | null>(null);

  const sorted = useMemo(() => items, [items]);

  return viewing ? (
    <ViewingScreen
      key={viewing.id}
      viewingId={viewing.id}
      items={items}
      onBack={() => setViewing(null)}
      onRemove={async (id) => { await remove(id); setViewing(null); }}
      markRead={markRead}
      fallback={viewing}
    />
  ) : (
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Receitas Recebidas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Receitas enviadas por outros usuários ComaBem.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Carregando…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Nenhuma receita recebida ainda.</p>
          <p className="text-sm mt-1">Quando alguém te enviar uma receita, ela aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r) => {
            const d = r.dados;
            return (
              <button
                key={r.id}
                onClick={() => setViewing(r)}
                className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all relative"
              >
                {!r.read && (
                  <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow">
                    NOVA
                  </span>
                )}
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
                  {d.foto ? (
                    <img src={d.foto} alt={d.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <ChefHat className="h-10 w-10 text-primary/60" />
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="font-semibold text-foreground text-sm line-clamp-2">{d.nome}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {r.sender_name || r.sender_email || "Usuário"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {d.informacoes_nutricionais?.calorias && <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{d.informacoes_nutricionais.calorias}</span>}
                    {d.tempo_preparo && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{d.tempo_preparo}</span>}
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
