import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResponsavelAutorizarSaude = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const token = params.get("token") || "";
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [confirmLegalAuthority, setConfirmLegalAuthority] = useState(false);
  const [confirmHealthConsent, setConfirmHealthConsent] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const accept = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-health-data-consent", {
        body: { token, guardianName, relationship, confirmLegalAuthority, confirmHealthConsent },
      });
      if (error) throw error;
      if (!data?.success) throw new Error("A autorização não foi confirmada.");
      setCompleted(true);
      toast({ title: "Autorização registrada" });
    } catch (error) {
      toast({
        title: "Não foi possível registrar a autorização",
        description: error instanceof Error ? error.message : "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const returnUrl = location.pathname + location.search;
  const loginUrl = "/login?redirect=" + encodeURIComponent(returnUrl);
  const signupUrl = "/cadastro?redirect=" + encodeURIComponent(returnUrl);

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Verificando acesso...</main>;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-xl space-y-5 rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-display font-bold">Autorização de dados de saúde de adolescente</h1>
        {completed ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A autorização foi registrada. O adolescente poderá voltar ao cadastro e atualizar a página para continuar. A autorização poderá ser revogada nas configurações da conta.
            </p>
            <p className="text-xs text-muted-foreground">O registro documenta sua declaração e a conta adulta utilizada. Ele não substitui uma verificação documental da guarda ou da representação legal.</p>
          </>
        ) : !token ? (
          <p className="text-sm text-destructive">O link está incompleto. Peça ao adolescente que gere uma nova solicitação.</p>
        ) : !user ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para continuar, entre em uma conta ComaFacil de adulto, com e-mail confirmado e data de nascimento cadastrada. A conta do adolescente não pode aprovar a própria solicitação.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full"><Link to={loginUrl}>Entrar na conta adulta</Link></Button>
              <Button asChild variant="outline" className="w-full"><Link to={signupUrl}>Criar conta adulta e confirmar e-mail</Link></Button>
            </div>
          </>
        ) : (
          <form onSubmit={accept} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Conta autenticada: {user.email}. O servidor verificará a data de nascimento cadastrada (18 anos ou mais) e a confirmação do e-mail. Esses dados não equivalem a uma verificação documental de identidade.
            </p>
            <div className="space-y-2">
              <Label htmlFor="guardian-name">Seu nome completo</Label>
              <Input id="guardian-name" value={guardianName} onChange={(event) => setGuardianName(event.target.value)} minLength={3} maxLength={120} required />
            </div>
            <div className="space-y-2">
              <Label>Vínculo com o adolescente</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue placeholder="Selecione seu vínculo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pai">Pai</SelectItem>
                  <SelectItem value="mae">Mãe</SelectItem>
                  <SelectItem value="tutor_legal">Tutor(a) legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox id="legal-authority" checked={confirmLegalAuthority} onCheckedChange={(value) => setConfirmLegalAuthority(value === true)} />
              <Label htmlFor="legal-authority" className="text-sm leading-relaxed">
                Declaro que sou maior de 18 anos, pai, mãe ou tutor(a) legal do adolescente e que tenho autoridade para conceder esta autorização.
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox id="health-consent" checked={confirmHealthConsent} onCheckedChange={(value) => setConfirmHealthConsent(value === true)} />
              <Label htmlFor="health-consent" className="text-sm leading-relaxed">
                Autorizo, de forma específica e destacada, o tratamento dos dados de saúde e alimentação do adolescente para personalizar cardápios, receitas, alertas e recursos que ele solicitar. Li a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link> e compreendo que a autorização pode ser revogada.
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              A conta adulta e o e-mail serão verificados tecnicamente. O vínculo familiar ou a autoridade legal é declarado por você e não passa por conferência documental automática.
            </p>
            <Button type="submit" className="w-full" disabled={submitting || !guardianName.trim() || !relationship || !confirmLegalAuthority || !confirmHealthConsent}>
              {submitting ? "Registrando autorização..." : "Confirmar autorização"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={signOut}>Esta não é a conta do responsável — sair</Button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ResponsavelAutorizarSaude;
