import { Button } from "@/components/ui/button";
import { Check, X, Star, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Essencial",
    price: "19,90",
    description: "Comece sua jornada com o básico",
    icon: Zap,
    features: [
      { text: "3 downloads de PDF por mês", included: true },
      { text: "Analisador de pratos\u00a0", included: true },
      { text: "Até 3 cardápios por conta", included: true },
      { text: "Lista de compras automática", included: true },
      { text: "Criação de receitas com IA", included: true },
      { text: "Chatbot com limite de uso", included: true },
      { text: "Rastreador de progresso", included: false },
      { text: "Score Diário e Conquistas", included: false },
      { text: "Modo Esporte", included: false },
      { text: "\u00a0Adaptador de dietas", included: false },
    ],
    highlighted: false,
    badge: null,
  },
  {
    name: "Equilíbrio",
    price: "27,90",
    description: "Melhor custo-benefício",
    icon: Star,
    features: [
      { text: "10 downloads de PDF por mês", included: true },
      { text: "Cardápios ilimitados", included: true },
      { text: "Lista de compras completa", included: true },
      { text: "Rastreador de progresso", included: true },
      { text: "Analisador de pratos\u00a0", included: true },
      { text: "\u00a0Adaptador de dietas", included: true },
      { text: "Modo Esporte completo", included: true },
      { text: "Chatbot ilimitado", included: true },
      { text: "Feedback nutricional automático", included: true },
      { text: "Score Diário e Conquistas", included: false },
    ],
    highlighted: true,
    badge: "Mais Popular",
  },
  {
    name: "Performance",
    price: "35,90",
    description: "Desbloqueie todo o potencial",
    icon: Crown,
    features: [
      { text: "20 Downloads de PDF\u00a0", included: true },
      { text: "Tudo do Equilíbrio", included: true },
      { text: "Score Diário, streak e níveis", included: true },
      { text: "Sistema de Conquistas completo", included: true },
      { text: "Sugestões nutricionais avançadas", included: true },
      { text: "Ajuste automático de cardápio", included: true },
      { text: "\u00a0Prioridade no atendimento de ajuda.", included: true },
      { text: "\u00a0Nutricionista IA pessoal", included: true },
      { text: "Análise avançada de pratos", included: true },
    ],
    highlighted: false,
    badge: "Premium",
  },
];

const Pricing = () => {
  return (
    <section id="precos" className="py-12 md:py-20 scroll-mt-20" style={{ backgroundColor: "#ffffff" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Escolha seu plano
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis por 7 dias e escolha o plano ideal para você
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 lg:p-8 animate-fade-in ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground shadow-2xl md:scale-105 z-10"
                    : "bg-card shadow-lg"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.badge && plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      <Star size={14} className="fill-current" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {plan.badge && !plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      <Crown size={14} />
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                  plan.highlighted ? "bg-primary-foreground/20" : "bg-primary/10"
                }`}>
                  <Icon size={20} className={plan.highlighted ? "text-primary-foreground" : "text-primary"} />
                </div>

                <h3 className={`text-xl font-semibold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">R${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    /mês
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        feature.included
                          ? plan.highlighted ? "bg-primary-foreground/20" : "bg-primary/10"
                          : "bg-muted"
                      }`}>
                        {feature.included ? (
                          <Check size={12} className={plan.highlighted ? "text-primary-foreground" : "text-primary"} />
                        ) : (
                          <X size={12} className="text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included
                          ? plan.highlighted ? "" : "text-foreground/80"
                          : "text-muted-foreground line-through"
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/cadastro" className="block">
                  <Button
                    className={`w-full font-semibold ${
                      plan.highlighted
                        ? "bg-background text-primary hover:bg-background/90"
                        : ""
                    }`}
                    variant={plan.highlighted ? "secondary" : "default"}
                    size="lg"
                  >
                    Começar Agora
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
