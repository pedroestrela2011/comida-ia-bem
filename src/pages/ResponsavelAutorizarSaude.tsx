import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ResponsavelAutorizarSaude = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
    <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-foreground">Autorização agora é feita na conta</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Os links de autorização não são mais necessários. O responsável legal confirma a declaração diretamente
        na conta do adolescente, durante o cadastro de saúde. Autorizações já concedidas continuam válidas.
      </p>
      <Button asChild className="w-full"><Link to="/">Voltar ao início</Link></Button>
    </div>
  </div>
);

export default ResponsavelAutorizarSaude;
