import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart, Download, CheckCheck, Eraser, CheckCircle2, Beef, Carrot, Apple,
  Wheat, Milk, FlaskConical, Package, Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildShoppingList, periodoLabel, CATEGORY_LABEL, ShoppingCategory,
} from "@/lib/shopping-list";
import { exportListaComprasPDF } from "@/lib/lista-compras-pdf";
import { toast } from "@/hooks/use-toast";

const CATEGORY_ICON: Record<ShoppingCategory, React.ComponentType<{ className?: string }>> = {
  proteinas: Beef,
  legumes_verduras: Carrot,
  frutas: Apple,
  carboidratos: Wheat,
  laticinios: Milk,
  temperos: FlaskConical,
  outros: Package,
};

type MealLike = { ingredientes?: string[] } | null | undefined;

type Props = {
  cardapio: Record<string, Record<string, MealLike>> | undefined;
  /** identificador da origem (cardapio normal x esporte) para isolar as marcações */
  storageKey: string;
  /** destaca ingredientes com alto valor proteico */
  destacarProteina?: boolean;
  canDownload?: boolean;
  onLimitReached?: () => void;
  onRegisterDownload?: () => void | Promise<void>;
};

export function ShoppingListPanel({
  cardapio,
  storageKey,
  destacarProteina = false,
  canDownload = true,
  onLimitReached,
  onRegisterDownload,
}: Props) {
  const list = useMemo(() => buildShoppingList(cardapio), [cardapio]);
  const periodo = useMemo(() => periodoLabel(), []);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [updated, setUpdated] = useState(false);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const prevKeysRef = useRef<string[] | null>(null);

  // Restaura marcações salvas localmente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`lista-compras:${storageKey}`);
      if (raw) setChecked(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Atualização reativa: detecta itens novos/removidos e preserva marcações
  useEffect(() => {
    const keys = list.items.map((i) => i.key);
    const prev = prevKeysRef.current;
    prevKeysRef.current = keys;

    if (prev === null) return; // primeira renderização

    const added = keys.filter((k) => !prev.includes(k));
    const removed = prev.filter((k) => !keys.includes(k));
    if (added.length === 0 && removed.length === 0) return;

    // remove marcações de ingredientes que saíram do cardápio
    setChecked((c) => {
      const next: Record<string, boolean> = {};
      for (const k of keys) if (c[k]) next[k] = true;
      return next;
    });

    setUpdated(true);
    setNewKeys(added);
    const t1 = setTimeout(() => setUpdated(false), 3000);
    const t2 = setTimeout(() => setNewKeys([]), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [list]);

  // Persiste marcações
  useEffect(() => {
    try {
      localStorage.setItem(`lista-compras:${storageKey}`, JSON.stringify(checked));
    } catch { /* ignore */ }
  }, [checked, storageKey]);

  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const marcarTodos = () => {
    const next: Record<string, boolean> = {};
    list.items.forEach((i) => { next[i.key] = true; });
    setChecked(next);
  };
  const limpar = () => setChecked({});

  const baixarPdf = async () => {
    if (!canDownload) { onLimitReached?.(); return; }
    try {
      exportListaComprasPDF(list, periodo, { marcarProteina: destacarProteina });
      await onRegisterDownload?.();
      toast({ title: "PDF da lista gerado!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e.message, variant: "destructive" });
    }
  };

  const totalMarcados = list.items.filter((i) => checked[i.key]).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Lista de Compras</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {periodo} · {totalMarcados} de {list.items.length} itens marcados
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={baixarPdf} style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }} className="hover:opacity-90">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar PDF
          </Button>
          <Button size="sm" variant="outline" onClick={marcarTodos}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Marcar Todos
          </Button>
          <Button size="sm" variant="outline" onClick={limpar}>
            <Eraser className="mr-1.5 h-3.5 w-3.5" /> Limpar Marcações
          </Button>
        </div>
      </div>

      {updated && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          Lista atualizada com base nas suas alterações
        </div>
      )}

      {list.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum ingrediente encontrado. Gere um cardápio para montar sua lista.
        </p>
      ) : (
        <div className="space-y-5">
          {list.byCategory.map((grupo) => {
            const Icon = CATEGORY_ICON[grupo.categoria];
            return (
              <div key={grupo.categoria} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{CATEGORY_LABEL[grupo.categoria]}</h3>
                  <span className="text-xs text-muted-foreground">({grupo.items.length})</span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {grupo.items.map((item) => {
                    const isChecked = !!checked[item.key];
                    const isNew = newKeys.includes(item.key);
                    return (
                      <li
                        key={item.key}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                          isNew ? "border-primary bg-primary/10" : "border-border bg-background"
                        }`}
                      >
                        <Checkbox
                          id={`${storageKey}-${item.key}`}
                          checked={isChecked}
                          onCheckedChange={() => toggle(item.key)}
                        />
                        <label
                          htmlFor={`${storageKey}-${item.key}`}
                          className={`flex-1 flex items-center justify-between gap-2 text-sm cursor-pointer ${
                            isChecked ? "line-through opacity-50" : ""
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-foreground">
                            {item.nome}
                            {destacarProteina && item.altaProteina && (
                              <Dumbbell className="h-3.5 w-3.5 text-primary" aria-label="Rico em proteína" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {[item.quantidade, item.unidade].filter(Boolean).join(" ")}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
