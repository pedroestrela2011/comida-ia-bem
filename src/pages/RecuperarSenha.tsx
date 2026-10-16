import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RecuperarSenha = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErro("Informe um email válido");
      return;
    }
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        toast({
          title: "Muitas tentativas",
          description: "Aguarde alguns minutos antes de pedir um novo link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Não foi possível enviar o email",
          description: "Verifique o endereço informado e tente novamente.",
          variant: "destructive",
        });
      }
      return;
    }

    setEnviado(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">ComaFacil</span>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Verifique seu email
            </h2>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para <strong>{email}</strong>. Clique no link
              do email para confirmar que é você e criar uma nova senha.
            </p>
            <p className="text-sm text-muted-foreground">
              Não recebeu? Verifique a caixa de spam ou{" "}
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="text-primary font-medium hover:underline"
              >
                tente novamente
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Recuperar senha
            </h2>
            <p className="text-muted-foreground mb-8">
              Informe o email da sua conta. Enviaremos um link para você confirmar sua
              identidade e criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={erro ? "border-destructive" : ""}
                />
                {erro && <p className="text-sm text-destructive">{erro}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full font-semibold text-base" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RecuperarSenha;
