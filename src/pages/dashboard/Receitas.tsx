import { ChefHat } from "lucide-react";

export default function Receitas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChefHat className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
      </div>
      <p className="text-muted-foreground">
        Em breve você poderá criar receitas a partir dos seus ingredientes.
      </p>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhuma receita salva ainda.</p>
        <p className="text-sm text-muted-foreground mt-1">Esta funcionalidade será habilitada na Fase 4.</p>
      </div>
    </div>
  );
}
