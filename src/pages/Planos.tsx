import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ArrowLeft, Crown, Star, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "essencial",
    name: "Essencial",
    price: "19,90",
    description: "Comece sua jornada com o básico",
    icon: Zap,
    features: [
      { text: "Cardápios semanais completos", included: true },
      { text: "Até 3 cardápios por conta", included: true },
      { text: "Lista de compras automática", included: true },
      { text: "Criação de receitas com IA", included: true },
      { text: "Chatbot com limite de uso", included: true },
      { text: "Marcar refeições como concluídas", included: false },
      { text: "Score Diário e Conquistas", included: false },
      { text: "Modo Esporte", included: false },
      { text: "Analisador de Prato", included: false },
    ],
    highlighted: false,
  },
  {
    id: "equilibrio",
    name: "Equilíbrio",
    price: "27,90",
    description: "Melhor custo-benefício",
    icon: Star,
    features: [
      { text: "Cardápios ilimitados", included: true },
      { text: "Lista de compras completa", included: true },
      { text: "Marcar refeições como concluídas", included: true },
      { text: "Score Diário, streak e níveis", included: true },
      { text: "Rastreador de Progresso", included: true },
      { text: "Modo Esporte completo", included: true },
      { text: "Chatbot ilimitado", included: true },
      { text: "Feedback nutricional automático", included: true },
      { text: "Analisador de Prato", included: false },
    ],
    highlighted: true,
  },
  {
    id: "performance",
    name: "Performance",
    price: "35,90",
    description: "Desbloqueie todo o potencial",
    icon: Crown,
    features: [
      { text: "Tudo do Equilíbrio", included: true },
      { text: "Analisador de Prato completo", included: true },
      { text: "Sugestões nutricionais avançadas", included: true },
      { text: "Ajuste automático de cardápio", included: true },
      { text: "Insights personalizados com IA", included: true },
      { text: "Prioridade no chatbot", included: true },
      { text: "Acesso antecipado a novidades", included: true },
    ],
    highlighted: false,
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelect = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find((p) => p.id === planId);
    toast({
      title: `Plano ${plan?.name} selecionado!`,
      description: "Redirecionando para o dashboard...",
    });
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Todos os planos incluem 7 dias grátis. Cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-primary shadow-xl scale-[1.03] ring-2 ring-primary/20"
                    : "hover:-translate-y-1"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} className="fill-current" />
                    Mais Popular
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
                      <li key={f.text} className="flex items-start gap-2 text-sm">
                        {f.included ? (
                          <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        ) : (
                          <X size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <span className={f.included ? "text-foreground/80" : "text-muted-foreground line-through"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelect(plan.id)}
                    disabled={selectedPlan !== null}
                    className="w-full font-semibold"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {selectedPlan === plan.id ? "Selecionado!" : "Começar Agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Sem cartão de crédito necessário para o período de teste
        </p>
      </div>
    </div>
  );
};

export default Planos;
