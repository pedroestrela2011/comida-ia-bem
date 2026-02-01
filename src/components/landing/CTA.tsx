import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const perks = [
  "7 dias grátis para testar",
  "Cancele quando quiser",
  "Suporte humanizado",
  "Atualizações constantes",
];

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-green-600 to-green-700">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
            Pronto para transformar sua alimentação?
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão comendo melhor com a ajuda do ComaBem.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-5 h-5 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-primary-foreground" />
                </div>
                <span className="text-sm md:text-base">{perk}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link to="/cadastro">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-10 py-7 font-semibold shadow-2xl hover:shadow-3xl transition-all group bg-background text-primary hover:bg-background/90"
            >
              Comece Grátis Agora
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Trust Text */}
          <p className="mt-6 text-sm text-primary-foreground/70">
            Sem cartão de crédito • Comece em menos de 1 minuto
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
