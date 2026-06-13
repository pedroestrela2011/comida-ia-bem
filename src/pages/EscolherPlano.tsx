import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Crown, Star, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PENDING_SIGNUP_KEY } from "./Cadastro";
import { PLAN_CONFIG, PlanType } from "@/contexts/SubscriptionContext";

type PlanCard = {
  id: PlanType;
  name: string;
  price: string;
  description: string;
  icon: typeof Zap;
  features: string[];
  highlighted: boolean;
  badge?: string;
};

const plans: PlanCard[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: PLAN_CONFIG.essencial.price,
    description: "Comece sua jornada com o básico",
    icon: Zap,
    features: [
      "Cardápios semanais completos",
      "Até 3 cardápios por conta",
      "Lista de compras automática",
      "Criação de receitas com IA",
      "Chatbot com limite de uso",
    ],
    highlighted: false,
  },
  {
    id: "equilibrio",
    name: "Equilíbrio",
    price: PLAN_CONFIG.equilibrio.price,
    description: "Melhor custo-benefício",
    icon: Star,
    features: [
      "Cardápios ilimitados",
      "Marcar refeições como concluídas",
      "Analisador de Prato completo",
      "Rastreador de Progresso",
      "Modo Esporte completo",
      "Chatbot ilimitado",
    ],
    highlighted: true,
    badge: "Mais escolhido",
  },
  {
    id: "performance",
    name: "Performance",
    price: PLAN_CONFIG.performance.price,
    description: "Desbloqueie todo o potencial",
    icon: Crown,
    features: [
      "Tudo do Equilíbrio",
      "Score Diário, streak e níveis",
      "Sistema de Conquistas completo",
      "Insights personalizados com IA",
      "Prioridade no chatbot",
      "Acesso antecipado a novidades",
    ],
    highlighted: false,
  },
];

const EscolherPlano = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{
    nome: string;
    email: string;
    senha: string;
    data_nascimento: string;
    pais: string;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) {
      toast({
        title: "Complete seu cadastro primeiro",
        description: "Volte e preencha seus dados.",
      });
      navigate("/cadastro", { replace: true });
      return;
    }
    try {
      setPending(JSON.parse(raw));
    } catch {
      navigate("/cadastro", { replace: true });
    }
  }, [navigate, toast]);

  const createAccount = async (planId: PlanType, opts: { skipCheckout: boolean }) => {
    if (!pending) return;
    setSelectedPlan(planId);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: pending.email,
        password: pending.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: pending.nome,
            data_nascimento: pending.data_nascimento,
            pais: pending.pais,
            plano: planId,
            skip_checkout: opts.skipCheckout,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Ensure session is active (auto-confirm is on, but signUp may not always set a session in all flows)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: pending.email,
          password: pending.senha,
        });
        if (signInError) throw signInError;
      }

      sessionStorage.removeItem(PENDING_SIGNUP_KEY);

      toast({
        title: "Conta criada com sucesso!",
        description: opts.skipCheckout
          ? "Bem-vindo ao NutriPlus."
          : `Abrindo o pagamento do plano ${PLAN_CONFIG[planId].label}...`,
      });

      if (!opts.skipCheckout) {
        try {
          const { data, error } = await supabase.functions.invoke("create-checkout", {
            body: { priceId: PLAN_CONFIG[planId].price_id },
          });
          if (!error && data?.url) {
            const win = window.open(data.url, "_blank", "noopener,noreferrer");
            if (!win) {
              window.top
                ? (window.top.location.href = data.url)
                : (window.location.href = data.url);
            }
          }
        } catch (err) {
          console.error("Checkout error:", err);
        }
      }

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const raw = (err?.message || "").toLowerCase();
      let description = "Tente novamente.";
      if (raw.includes("user already registered") || raw.includes("already registered") || raw.includes("already exists")) {
        description = "Este email já está cadastrado. Faça login na sua conta.";
      } else if (raw.includes("invalid email")) {
        description = "Email inválido. Verifique e tente novamente.";
      } else if (raw.includes("password") && raw.includes("short")) {
        description = "A senha é muito curta. Use ao menos 6 caracteres.";
      } else if (raw.includes("weak password")) {
        description = "Senha fraca. Escolha uma senha mais forte.";
      } else if (raw.includes("rate limit") || raw.includes("too many")) {
        description = "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
      } else if (raw.includes("network") || raw.includes("failed to fetch")) {
        description = "Falha de conexão. Verifique sua internet e tente novamente.";
      } else if (raw.includes("invalid login")) {
        description = "Email ou senha incorretos.";
      } else if (err?.message) {
        description = err.message;
      }
      toast({
        title: "Erro ao criar conta",
        description,
        variant: "destructive",
      });
      setSelectedPlan(null);
      setLoading(false);
    }
  };

  const handleSelect = (planId: PlanType) => createAccount(planId, { skipCheckout: false });
  const handleSkip = () => createAccount("essencial", { skipCheckout: true });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao cadastro
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium max-w-xs mx-auto">
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">1. Cadastro</span>
            <span className="h-px flex-1 bg-border" />
            <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground">2. Plano</span>
          </div>

          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {pending?.nome ? `Olá, ${pending.nome.split(" ")[0]}!` : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para sua jornada. Você pode mudar quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-primary shadow-xl md:scale-[1.03] ring-2 ring-primary/20"
                    : "hover:-translate-y-1"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Star size={12} className="fill-current" />
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelect(plan.id)}
                    disabled={loading}
                    className="w-full font-semibold"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {isSelected && loading ? "Processando..." : "Começar agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Após selecionar, você será direcionado ao pagamento e poderá acessar o dashboard imediatamente.
          </p>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 disabled:opacity-50"
            disabled={loading}
          >
            Pular pagamento e criar conta gratuita
          </button>
        </div>
      </div>
    </div>
  );
};

export default EscolherPlano;
