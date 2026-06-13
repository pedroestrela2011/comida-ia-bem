import { useState } from "react";
import { Lock, Crown, Star, Zap, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_CONFIG, PlanType } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const planMeta: Record<PlanType, { icon: typeof Zap; description: string; features: string[]; highlighted: boolean }> = {
  essencial: {
    icon: Zap,
    description: "Comece sua jornada",
    features: ["Cardápios semanais", "Lista de compras", "Receitas com IA", "Chatbot básico"],
    highlighted: false,
  },
  equilibrio: {
    icon: Star,
    description: "Mais escolhido",
    features: ["Cardápios ilimitados", "Analisador de Prato", "Rastreador de Progresso", "Modo Esporte"],
    highlighted: true,
  },
  performance: {
    icon: Crown,
    description: "Tudo desbloqueado",
    features: ["Tudo do Equilíbrio", "Score Diário", "Conquistas", "Insights com IA"],
    highlighted: false,
  },
};

export function TrialExpired() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handleSubscribe = async (planId: PlanType) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PLAN_CONFIG[planId].price_id },
      });
      if (error) throw error;
      if (data?.url) {
        const win = window.open(data.url, "_blank", "noopener,noreferrer");
        if (!win) window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Erro ao abrir o pagamento",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 md:p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2">
            Seu período gratuito terminou
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Os 7 dias do plano Essencial chegaram ao fim. Escolha um plano abaixo para continuar
            usando o NutriPlus sem interrupções.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {(Object.keys(PLAN_CONFIG) as PlanType[]).map((id) => {
            const cfg = PLAN_CONFIG[id];
            const meta = planMeta[id];
            const Icon = meta.icon;
            return (
              <Card
                key={id}
                className={`flex flex-col ${
                  meta.highlighted ? "border-primary ring-2 ring-primary/20 shadow-xl" : ""
                }`}
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      meta.highlighted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <CardTitle>{cfg.label}</CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-3xl font-bold text-foreground">{cfg.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {meta.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(id)}
                    disabled={loadingPlan !== null}
                    className="w-full"
                    variant={meta.highlighted ? "default" : "outline"}
                  >
                    {loadingPlan === id ? "Abrindo..." : "Assinar agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
