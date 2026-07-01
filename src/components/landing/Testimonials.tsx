import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Silva",
    text: "Em 2 semanas já organizei minha alimentação completamente. O cardápio personalizado mudou minha rotina!",
  },
  {
    name: "Carlos Mendes",
    text: "O Modo Esporte foi incrível para minha preparação. Melhorei meu rendimento nos treinos em pouco tempo.",
  },
  {
    name: "Juliana Costa",
    text: "Nunca pensei que comer saudável fosse tão prático. As receitas inteligentes são perfeitas para o meu dia a dia.",
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Testimonials = () => {
  return (
    <section className="py-12 md:py-20" style={{ backgroundColor: "#ffffff" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            O que nossos usuários dizem
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <div
              key={t.name}
              className="animate-fade-in"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e8f5e9",
                borderRadius: "16px",
                padding: "24px",
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold"
                  style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }}
                >
                  {getInitials(t.name)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        style={{ color: "#f59e0b", fill: "#f59e0b" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
