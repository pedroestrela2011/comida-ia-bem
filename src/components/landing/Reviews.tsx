import { Star } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Maria Santos",
    avatar: "MS",
    rating: 5,
    text: "O ComaBem mudou minha vida! Perdi 8kg em 3 meses sem passar fome. As receitas são deliciosas e práticas.",
    role: "Empresária",
  },
  {
    id: 2,
    name: "João Silva",
    avatar: "JS",
    rating: 5,
    text: "Nunca imaginei que comer saudável pudesse ser tão fácil. O chatbot tira todas as minhas dúvidas na hora!",
    role: "Professor",
  },
  {
    id: 3,
    name: "Ana Oliveira",
    avatar: "AO",
    rating: 5,
    text: "A lista de compras automática é incrível! Economizo tempo e dinheiro toda semana. Super recomendo!",
    role: "Médica",
  },
  {
    id: 4,
    name: "Carlos Mendes",
    avatar: "CM",
    rating: 5,
    text: "Ganhei 5kg de massa muscular seguindo os cardápios personalizados. A IA realmente entende minhas necessidades.",
    role: "Personal Trainer",
  },
];

const Reviews = () => {
  return (
    <section className="py-12 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de pessoas já transformaram sua alimentação com o ComaBem
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={18} className="fill-accent text-accent" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{review.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {review.avatar}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
