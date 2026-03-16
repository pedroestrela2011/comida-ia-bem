import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerificarEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const email = (location.state as { email?: string })?.email || "";
  const [resending, setResending] = useState(false);

  // Listen for auth state changes (user clicks link and gets verified)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast({ title: "Email verificado!", description: "Conta criada com sucesso." });
        navigate("/planos");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast({ title: "Email reenviado!", description: "Verifique sua caixa de entrada." });
    } catch (err: any) {
      toast({ title: "Erro ao reenviar", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar ao cadastro
        </Link>

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="text-primary" size={28} />
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Verifique seu email
        </h2>
        <p className="text-muted-foreground mb-2">
          Enviamos um link de confirmação para
        </p>
        <p className="text-foreground font-medium mb-6">{email}</p>

        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Abra seu email e clique no link de confirmação</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Você será redirecionado automaticamente após confirmar</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Verifique também a pasta de spam</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Não recebeu o email?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "Reenviando..." : "Reenviar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerificarEmail;
