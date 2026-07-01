import { Calendar, Camera, UtensilsCrossed, TrendingUp } from "lucide-react";

const demos = [
  {
    icon: Calendar,
    title: "Criação de Cardápio",
    description: "Cardápio semanal gerado em segundos com base nos seus objetivos.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: Camera,
    title: "Analisador de Pratos",
    description: "Fotografe seu prato e receba análise nutricional instantânea.",
    accent: "from-accent/20 to-accent/5",
  },
  {
    icon: UtensilsCrossed,
    title: "Receitas Inteligentes",
    description: "Use o que tem em casa para preparar pratos completos e saudáveis.",
    accent: "from-earth-100 to-earth-50",
  },
  {
    icon: TrendingUp,
    title: "Acompanhamento de Progresso",
    description: "Visualize peso, energia, sono e treinos em gráficos claros.",
    accent: "from-green-100 to-green-50",
  },
];

const VisualDemo = () => {
  return (
    <section className="py-12 md:py-20" style={{ backgroundColor: "#f0f7f0" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Veja a ComaFacil em ação
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma prévia de como a plataforma transforma sua rotina alimentar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {demos.map((demo, index) => (
            <div
              key={demo.title}
              className="group bg-card rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`relative aspect-video bg-gradient-to-br ${demo.accent} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--foreground))_1px,transparent_0)] [background-size:20px_20px]" />
                <div className="relative w-20 h-20 rounded-2xl bg-card/90 backdrop-blur shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <demo.icon className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{demo.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{demo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualDemo;
