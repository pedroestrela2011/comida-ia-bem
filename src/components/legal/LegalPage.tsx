import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/landing/Footer";

interface LegalPageProps {
  title: string;
  updatedAt: string;
  intro?: string;
  children: ReactNode;
}

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const LegalPage = ({ title, updatedAt, intro, children }: LegalPageProps) => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">C</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">ComaFacil</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 md:py-16 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-8">Última atualização: {updatedAt}</p>
          {intro && <p className="text-muted-foreground leading-relaxed mb-8">{intro}</p>}
          <div className="space-y-8">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
