import { UserPlus, Target, ClipboardList, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crie sua conta",
    description: "Cadastro rápido em menos de um minuto para começar sua jornada.",
  },
  {
    icon: Target,
    step: "02",
    title: "Escolha seu objetivo",
    description: "Conte o que você quer alcançar: saúde, performance ou emagrecimento.",
  },
  {
    icon: ClipboardList,
    step: "03",
    title: "Receba seu plano",
    description: "Nossa IA monta cardápio, receitas e lista de compras feitos para você.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Acompanhe sua evolução",
    description: "Acompanhe progresso, conquistas e ajustes automáticos ao longo do tempo.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-12 md:py-20 bg-primary/5 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Como funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em 4 passos simples você transforma sua alimentação
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}

              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-32 h-32 bg-card rounded-full shadow-xl flex items-center justify-center border-4 border-primary/20">
                  <item.icon className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-sm">
                    {item.step}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
