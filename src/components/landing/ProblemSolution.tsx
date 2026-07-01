import { Clock, AlertCircle, Wallet, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const problems = [
  { icon: Clock, title: "Falta de tempo", description: "Rotina corrida e sem espaço para planejar refeições." },
  { icon: AlertCircle, title: "Dietas complicadas", description: "Regras confusas que ninguém consegue seguir." },
  { icon: Wallet, title: "Gastos desnecessários", description: "Compras erradas e comida que vai para o lixo." },
  { icon: Target, title: "Dificuldade nos objetivos", description: "Não saber o que comer para alcançar suas metas." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const ProblemSolution = () => {
  return (
    <section className="py-12 md:py-20" style={{ backgroundColor: "#ffffff" }}>
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4"
          >
            Cansado de não saber o que comer?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Você não está sozinho. A maioria das pessoas enfrenta os mesmos desafios todos os dias.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
        >
          {problems.map((problem) => (
            <motion.div
              key={problem.title}
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <motion.div
                className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4"
                initial={{ boxShadow: "0 0 0px hsl(var(--primary) / 0)" }}
                whileInView={{
                  boxShadow: [
                    "0 0 0px hsl(var(--primary) / 0)",
                    "0 0 24px hsl(var(--primary) / 0.35)",
                    "0 0 0px hsl(var(--primary) / 0)",
                  ],
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              >
                <problem.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="relative max-w-3xl mx-auto rounded-2xl p-8 md:p-10 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 border border-primary/20 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={14} />
            <span className="text-xs md:text-sm font-medium">A solução</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            A ComaFacil resolve isso para você.
          </h3>
          <p className="text-base md:text-lg text-muted-foreground">
            Cardápios, receitas e acompanhamento criados por inteligência artificial — adaptados à sua rotina, ao seu bolso e aos seus objetivos.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolution;
