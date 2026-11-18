import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function VerificarMFA() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        const { data: assurance, error: assuranceError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (assurance.currentLevel === "aal2") {
          navigate("/dashboard", { replace: true });
          return;
        }

        const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const factor = data.totp.find((item) => item.status === "verified");
        if (!factor) {
          setError("Não encontramos um autenticador confirmado nesta conta. Entre em contato com o suporte.");
          return;
        }
        if (active) setFactorId(factor.id);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Não foi possível preparar a verificação.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void prepare();
    return () => { active = false; };
  }, [navigate]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Digite o código de seis números do aplicativo autenticador.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (verifyError) throw verifyError;
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2") {
        throw new Error("A segunda etapa ainda não foi confirmada. Tente novamente.");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido ou expirado.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Verificação em duas etapas</h1>
              <p className="text-sm text-muted-foreground">Confirme o acesso pelo seu autenticador</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparando verificação...
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Abra o aplicativo autenticador que você vinculou à conta e informe o código temporário de seis números.
              </p>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Código de autenticação</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-xl tracking-[0.4em]"
                  disabled={!factorId || verifying}
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={!factorId || code.length !== 6 || verifying}>
                {verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</> : "Confirmar e entrar"}
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            Se você perdeu acesso ao autenticador, não tente compartilhar seus códigos. Procure o suporte para recuperação da conta.
          </p>
        </div>
      </div>
    </div>
  );
}
