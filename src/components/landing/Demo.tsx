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
  {
    icon: Share2,
    title: "Compartilhar Receitas",
    description:
      "Envie receitas para amigos no formato exclusivo .cbrecipe ou gere cards prontos para redes sociais.",
    color: "bg-earth-100 text-earth-500",
  },
];

const Demo = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Tudo o que você encontra no NutriPlus
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
              className="group relative bg-card rounded-2xl p-6 shadow-md hover:shadow-2xl border border-border hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-7 h-7" />
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
