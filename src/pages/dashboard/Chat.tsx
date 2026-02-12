import { MessageCircle } from "lucide-react";

export default function Chat() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Conversa Saudável</h1>
      </div>
      <p className="text-muted-foreground">
        Em breve você poderá tirar dúvidas sobre nutrição com nosso assistente.
      </p>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">O chatbot será ativado na Fase 4.</p>
      </div>
    </div>
  );
}
