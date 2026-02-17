import { ClipboardList, ChefHat, ShoppingCart } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Informe suas preferências",
    description: "Conte seus objetivos, restrições alimentares, orçamento e quantas pessoas você alimenta.",
  },
  {
    icon: ChefHat,
    step: "02",
    title: "Receba seu cardápio",
    description: "Nossa IA cria um cardápio semanal completo com receitas deliciosas e nutritivas.",
  },
  {
    icon: ShoppingCart,
    step: "03",
    title: "Vá às compras",
    description: "Use a lista de compras automática e prepare suas refeições com praticidade.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-primary/5 scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Como funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em 3 passos simples você transforma sua alimentação
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connector Line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}

              {/* Icon Container */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-32 h-32 bg-card rounded-full shadow-xl flex items-center justify-center border-4 border-primary/20">
                  <item.icon className="w-12 h-12 text-primary" />
                </div>
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-sm">
                    {item.step}
                  </span>
                </div>
              </div>

              {/* Content */}
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
