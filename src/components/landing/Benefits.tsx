import { Clock, Heart, Sparkles, Wallet, Users, Leaf } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize Tempo",
    description: "Cardápios prontos em segundos. Chega de pensar no que cozinhar toda semana.",
  },
  {
    icon: Heart,
    title: "Alimentação Personalizada",
    description: "Receitas adaptadas aos seus gostos, restrições e objetivos de saúde.",
  },
  {
    icon: Wallet,
    title: "Controle seu Orçamento",
    description: "Defina quanto quer gastar e receba opções que cabem no seu bolso.",
  },
  {
    icon: Sparkles,
    title: "IA Inteligente",
    description: "Tecnologia avançada que aprende suas preferências e melhora com o tempo.",
  },
  {
    icon: Users,
    title: "Para Toda a Família",
    description: "Cardápios que atendem desde 1 pessoa até famílias grandes.",
  },
  {
    icon: Leaf,
    title: "Nutrição Completa",
    description: "Refeições balanceadas com todos os nutrientes que você precisa.",
  },
];

const Benefits = () => {
  return (
    <section id="beneficios" className="py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Por que escolher o ComaBem?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo o que você precisa para uma alimentação saudável em um só lugar
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group p-6 rounded-2xl bg-card hover:bg-primary/5 border border-border hover:border-primary/20 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
