import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-food.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-16 pb-8 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Comida saudável e deliciosa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full mb-4 md:mb-6">
            <Sparkles size={14} className="shrink-0" />
            <span className="text-xs md:text-sm font-medium">Alimentação inteligente com IA</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-4 md:mb-6">
            Ser saudável,{" "}
            <span className="text-primary">Nunca foi tão fácil.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
            Cardápios personalizados, receitas deliciosas e orientações nutricionais 
            criados por inteligência artificial. Transforme sua alimentação em poucos cliques.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/cadastro" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 font-semibold shadow-xl hover:shadow-2xl transition-all group">
                Comece Agora
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#como-funciona" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 font-semibold border-2"
              >
                Saiba Mais
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 md:gap-8 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border/50">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">Cardápios Inteligentes</p>
              <p className="text-sm text-muted-foreground">Criados com base nos seus objetivos.</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">Análise de Pratos</p>
              <p className="text-sm text-muted-foreground">Descubra nutrientes e receitas.</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">Modo Esporte</p>
              <p className="text-sm text-muted-foreground">Nutrição adaptada ao seu desempenho.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
