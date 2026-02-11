import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Crown, Star, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "basico",
    name: "Básico",
    price: "19,99",
    description: "Ideal para começar sua jornada saudável",
    icon: Zap,
    features: [
      "Cardápio semanal personalizado",
      "Lista de compras automática",
      "Receitas com IA",
      "Chatbot de nutrição",
      "Histórico de cardápios",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49,90",
    description: "O mais escolhido! Tudo que você precisa",
    icon: Star,
    features: [
      "Tudo do plano Básico",
      "Cardápios ilimitados",
      "Receitas premium",
      "Suporte prioritário",
      "Modo escuro",
      "Exportar lista de compras",
    ],
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "69,90",
    description: "Experiência completa para toda a família",
    icon: Crown,
    features: [
      "Tudo do plano Pro",
      "Perfis familiares (até 5)",
      "Acompanhamento nutricional",
      "Receitas exclusivas de chefs",
      "Consultoria nutricional IA",
      "Acesso antecipado a novidades",
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
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/* Content */}
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

        {/* Plans Grid */}
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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
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
                    disabled={selectedPlan !== null}
                    className="w-full font-semibold"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {selectedPlan === plan.id ? "Selecionado!" : "Escolher plano"}
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
