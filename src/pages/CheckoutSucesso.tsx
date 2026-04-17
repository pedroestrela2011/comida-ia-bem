import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight, Loader2, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_CONFIG, PlanType } from "@/contexts/SubscriptionContext";

const PLAN_FEATURES: Record<PlanType, string[]> = {
  essencial: [
    "Até 3 cardápios personalizados",
    "Acesso à biblioteca de receitas",
    "Chat nutricional com limite diário",
  ],
  equilibrio: [
    "Cardápios ilimitados",
    "Modo Esporte com cardápios para treino",
    "Rastreador de Progresso completo",
    "Analisador de Prato por foto",
    "Chat nutricional sem limites",
  ],
  performance: [
    "Tudo do plano Equilíbrio",
    "Score Diário de hábitos",
    "Sistema de Conquistas e badges",
    "Lembretes personalizados",
    "Suporte prioritário",
  ],
};

const CheckoutSucesso = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanType>("essencial");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 8;

    const fireConfetti = () => {
      const duration = 2500;
      const end = Date.now() + duration;
      const colors = ["#16a34a", "#22c55e", "#86efac", "#fbbf24", "#f59e0b"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors,
      });
    };

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        if (data?.subscribed) {
          setPlan(data.plan as PlanType);
          setSubscribed(true);
          setLoading(false);
          fireConfetti();
          return;
        }
      } catch (e) {
        console.error("Verification error:", e);
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(verify, 1500);
      } else {
        setLoading(false);
      }
    };

    verify();
  }, []);

  const planInfo = PLAN_CONFIG[plan];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            Confirmando seu pagamento...
          </h2>
          <p className="text-muted-foreground">Isso pode levar alguns segundos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-primary" size={40} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Pagamento confirmado!
        </h1>
        <p className="text-muted-foreground mb-8">
          {subscribed
            ? "Sua assinatura está ativa e pronta para uso."
            : "Estamos finalizando a ativação. Você já pode acessar o dashboard."}
        </p>

        {subscribed && (
          <>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="text-primary" size={18} />
                <span className="text-sm font-medium text-muted-foreground">Plano ativado</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                {planInfo.label}
              </h2>
              <p className="text-muted-foreground">
                R$ {planInfo.price} <span className="text-sm">/mês</span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 mb-8 text-left">
              <p className="text-sm font-semibold text-foreground mb-3 text-center">
                Recursos desbloqueados
              </p>
              <ul className="space-y-2.5">
                {PLAN_FEATURES[plan].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Check className="text-primary" size={12} strokeWidth={3} />
                    </span>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/dashboard">
              Ir para o dashboard
              <ArrowRight size={18} />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/dashboard/configuracoes">Gerenciar assinatura</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSucesso;
