import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Básico",
    price: "19,99",
    description: "Perfeito para começar sua jornada",
    features: [
      "1 cardápio por semana",
      "Receitas ilimitadas",
      "Lista de compras",
      "Chatbot básico",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "49,90",
    description: "O mais escolhido pelos usuários",
    features: [
      "Cardápios ilimitados",
      "Receitas ilimitadas",
      "Lista de compras inteligente",
      "Chatbot avançado",
      "Suporte prioritário",
      "Histórico completo",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "69,90",
    description: "Para quem quer o melhor",
    features: [
      "Tudo do Pro",
      "Análise nutricional detalhada",
      "Acompanhamento personalizado",
      "Acesso antecipado a novidades",
      "Suporte VIP",
    ],
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section id="precos" className="py-20 bg-secondary/30 scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Escolha seu plano
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis por 7 dias e escolha o plano ideal para você
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 lg:p-8 animate-fade-in ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground shadow-2xl scale-105 z-10"
                  : "bg-card shadow-lg"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                   <div className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    <Star size={14} className="fill-current" />
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className={`text-xl font-semibold mb-2 ${plan.highlighted ? "" : "text-foreground"}`}>
                {plan.name}
              </h3>

              {/* Description */}
              <p className={`text-sm mb-4 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold">R${plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  /mês
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.highlighted ? "bg-primary-foreground/20" : "bg-primary/10"
                    }`}>
                      <Check size={12} className={plan.highlighted ? "text-primary-foreground" : "text-primary"} />
                    </div>
                    <span className={`text-sm ${plan.highlighted ? "" : "text-foreground/80"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
