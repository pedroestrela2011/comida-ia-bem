import { Clock, AlertCircle, Wallet, Target, Sparkles } from "lucide-react";

const problems = [
  { icon: Clock, title: "Falta de tempo", description: "Rotina corrida e sem espaço para planejar refeições." },
  { icon: AlertCircle, title: "Dietas complicadas", description: "Regras confusas que ninguém consegue seguir." },
  { icon: Wallet, title: "Gastos desnecessários", description: "Compras erradas e comida que vai para o lixo." },
  { icon: Target, title: "Dificuldade nos objetivos", description: "Não saber o que comer para alcançar suas metas." },
];

const ProblemSolution = () => {
  return (
    <section className="py-12 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Cansado de não saber o que comer?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Você não está sozinho. A maioria das pessoas enfrenta os mesmos desafios todos os dias.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <problem.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-3xl mx-auto rounded-2xl p-8 md:p-10 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 border border-primary/20 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={14} />
            <span className="text-xs md:text-sm font-medium">A solução</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            A Coma Bem resolve isso para você.
          </h3>
          <p className="text-base md:text-lg text-muted-foreground">
            Cardápios, receitas e acompanhamento criados por inteligência artificial — adaptados à sua rotina, ao seu bolso e aos seus objetivos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
