import { Calendar, UtensilsCrossed, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Meu Cardápio",
    description: "Cardápio semanal completo organizado por dia, com receitas detalhadas e lista de compras automática.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: UtensilsCrossed,
    title: "Receitas",
    description: "Informe os ingredientes que você tem e receba receitas criativas e deliciosas criadas pela IA.",
    color: "bg-earth-100 text-earth-500",
  },
  {
    icon: MessageSquare,
    title: "Conversa Saudável",
    description: "Tire dúvidas sobre nutrição e alimentos com nosso chatbot inteligente e amigável.",
    color: "bg-accent/20 text-accent",
  },
];

const Demo = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Conheça nossas funcionalidades
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para você comer bem todos os dias
          </p>
        </div>

        {/* Features Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Mockup Preview Area */}
              <div className="h-48 bg-gradient-to-br from-muted to-secondary/50 flex items-center justify-center">
                <div className={`w-20 h-20 rounded-2xl ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-10 h-10" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Demo;
