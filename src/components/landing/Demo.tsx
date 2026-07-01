import {
  Calendar,
  UtensilsCrossed,
  MessageSquare,
  Camera,
  Dumbbell,
  TrendingUp,
  Trophy,
  Star,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Meu Cardápio",
    description:
      "Cardápios semanais gerados por IA, organizados por dia, com substituição inteligente e lista de compras automática.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: UtensilsCrossed,
    title: "Gerador de Receitas",
    description:
      "Informe os ingredientes que tem em casa e receba receitas completas com modo de preparo, tempo e porções.",
    color: "bg-earth-100 text-earth-500",
  },
  {
    icon: Camera,
    title: "Analisador de Prato",
    description:
      "Envie uma foto ou descreva seu prato e receba análise nutricional com nota de saúde de 1 a 10.",
    color: "bg-accent/20 text-accent",
  },
  {
    icon: Dumbbell,
    title: "Modo Esporte",
    description:
      "Cardápios específicos para atletas focados em performance, ganho de massa e recuperação muscular.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Chatbot Ali",
    description:
      "Assistente nutricional inteligente para tirar dúvidas sobre alimentos, receitas e hábitos saudáveis.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: TrendingUp,
    title: "Progresso",
    description:
      "Acompanhe peso, energia, sono e treinos em gráficos visuais e veja sua evolução ao longo do tempo.",
    color: "bg-earth-100 text-earth-500",
  },
  {
    icon: Trophy,
    title: "Score Diário",
    description:
      "Sistema gamificado com pontos, streaks e níveis que recompensam suas escolhas saudáveis todos os dias.",
    color: "bg-accent/20 text-accent",
  },
  {
    icon: Award,
    title: "Conquistas",
    description:
      "Desbloqueie 17 medalhas exclusivas conforme atinge marcos importantes na sua jornada nutricional.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Star,
    title: "Favoritos",
    description:
      "Salve suas receitas preferidas em uma biblioteca pessoal e acesse rapidamente quando quiser.",
    color: "bg-green-100 text-green-600",
  },
];

const Demo = () => {
  return (
    <section className="py-12 md:py-20" style={{ backgroundColor: "#f0f7f0" }}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Tudo o que você encontra no ComaFacil
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para transformar sua alimentação do planejamento ao prato
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative hover:-translate-y-1 animate-fade-in"
              style={{
                background: "linear-gradient(to bottom, #e8f5e9 0%, #ffffff 60%)",
                padding: "28px",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid transparent",
                transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                animationDelay: `${index * 60}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2d6a4f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <div
                className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "9999px",
                  backgroundColor: "#2d6a4f",
                  color: "#ffffff",
                }}
              >
                <feature.icon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Demo;
