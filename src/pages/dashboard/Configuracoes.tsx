import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </div>
      <p className="text-muted-foreground">
        Em breve você poderá editar seus dados pessoais e preferências.
      </p>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Settings className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">As configurações serão ativadas em breve.</p>
      </div>
    </div>
  );
}
