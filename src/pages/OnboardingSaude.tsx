import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PENDING_SIGNUP_KEY } from "./Cadastro";
import { StepCorpo, CorpoData } from "@/components/onboarding/StepCorpo";
import { StepObjetivos, ObjetivosData } from "@/components/onboarding/StepObjetivos";
import { StepSaude, SaudeData } from "@/components/onboarding/StepSaude";
import { calcIMC } from "@/lib/health";
import { supabase } from "@/integrations/supabase/client";

type PendingSignup = {
  nome: string;
  email: string;
  data_nascimento: string;
  pais: string;
};

type Health = {
  peso_kg: number;
  altura_cm: number;
  imc: number | null;
  objetivo: string;
  nivel_atividade: string;
  refeicoes_dia: number;
  restricoes_alimentares: string[];
  alergias: string;
  condicoes_saude: string[];
  condicoes_outras: string;
  onboarding_completo: true;
};

function isUnder18OrBirthDateInvalid(value?: string) {
  if (!value) return true;
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) return true;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age -= 1;
  return age < 18;
}

const OnboardingSaude = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [corpo, setCorpo] = useState<{ peso_kg: number; altura_cm: number; raw: CorpoData } | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivosData>({
    objetivo: "",
    nivel_atividade: "",
    refeicoes_dia: null,
  });
  const [saude, setSaude] = useState<SaudeData>({
    restricoes: [],
    alergias: "",
    condicoes: [],
    condicoes_outras: "",
  });
  const [guardianCheckDone, setGuardianCheckDone] = useState(false);
  const [guardianAuthorized, setGuardianAuthorized] = useState(false);
  const [requestingGuardian, setRequestingGuardian] = useState(false);
  const [guardianLink, setGuardianLink] = useState<string | null>(null);

  useEffect(() => {
    const loadPending = async () => {
      const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
      if (!raw) {
        toast({ title: "Complete seu cadastro primeiro" });
        navigate("/cadastro", { replace: true });
        return;
      }
      try {
        const parsed = JSON.parse(raw) as PendingSignup;
        setPending(parsed);
        if (isUnder18OrBirthDateInvalid(parsed.data_nascimento)) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData.user) {
            const { data: consent } = await (supabase as any)
              .from("health_data_consents")
              .select("id")
              .eq("user_id", authData.user.id)
              .eq("authorization_type", "guardian")
              .not("guardian_user_id", "is", null)
              .is("revoked_at", null)
              .limit(1)
              .maybeSingle();
            setGuardianAuthorized(!!consent);
          }
        }
      } catch {
        sessionStorage.removeItem(PENDING_SIGNUP_KEY);
        navigate("/cadastro", { replace: true });
      } finally {
        setGuardianCheckDone(true);
      }
    };
    loadPending();
  }, [navigate, toast]);

  const requiresGuardian = useMemo(
    () => isUnder18OrBirthDateInvalid(pending?.data_nascimento),
    [pending?.data_nascimento],
  );

  const requestGuardianAuthorization = async () => {
    setRequestingGuardian(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-health-data-consent-request");
      if (error) throw error;
      if (!data?.url) throw new Error("O servidor não retornou um link válido.");
      setGuardianLink(data.url);
      toast({ title: "Link de autorização criado", description: "Envie este link ao seu responsável legal." });
    } catch (error) {
      toast({
        title: "Não foi possível gerar o link",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setRequestingGuardian(false);
    }
  };

  const finish = async (dSaude: SaudeData) => {
    if (!pending || !corpo) return;
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      toast({ title: "Entre na sua conta para continuar", variant: "destructive" });
      navigate("/login", { replace: true });
      return;
    }

    const health: Health = {
      peso_kg: corpo.peso_kg,
      altura_cm: corpo.altura_cm,
      imc: calcIMC(corpo.peso_kg, corpo.altura_cm),
      objetivo: objetivos.objetivo,
      nivel_atividade: objetivos.nivel_atividade,
      refeicoes_dia: objetivos.refeicoes_dia!,
      restricoes_alimentares: dSaude.restricoes,
      alergias: dSaude.alergias,
      condicoes_saude: dSaude.condicoes,
      condicoes_outras: dSaude.condicoes_outras,
      onboarding_completo: true,
    };

    const consentText = "Autorizo o uso dos dados de saúde e alimentação fornecidos para personalizar cardápios, receitas e alertas solicitados por mim. Sei que posso revogar esta autorização e que recursos dependentes desses dados poderão deixar de funcionar.";
    const { error } = await supabase.rpc("save_health_profile_with_consent", {
      p_profile_data: health,
      p_policy_version: "2026-11-23",
      p_consent_text: consentText,
      p_confirm_consent: !requiresGuardian,
    });
    if (error) {
      toast({
        title: "Não foi possível salvar seus dados",
        description: error.message?.includes("autorização")
          ? "A autorização do responsável não foi encontrada ou não está mais ativa. Peça que ele conclua o link e atualize esta página."
          : "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.removeItem(PENDING_SIGNUP_KEY);
    navigate("/escolher-plano", { replace: true });
  };

  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;

  if (!pending) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando cadastro...</div>;
  }

  if (requiresGuardian && !guardianCheckDone) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Verificando autorização...</div>;
  }

  if (requiresGuardian && !guardianAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg space-y-5 rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-display font-bold text-foreground">Autorização do responsável</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Antes de solicitar medidas corporais, hábitos alimentares ou condições de saúde, um responsável legal precisa autorizar esse tratamento. Nenhum desses dados será coletado nesta etapa.
          </p>
          <Button className="w-full" onClick={requestGuardianAuthorization} disabled={requestingGuardian}>
            {requestingGuardian ? "Criando link..." : "Gerar link para meu responsável"}
          </Button>
          {guardianLink && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="guardian-link">Link individual (válido por 24 horas e uso único)</Label>
              <Input id="guardian-link" readOnly value={guardianLink} />
              <Button type="button" variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(guardianLink);
                toast({ title: "Link copiado" });
              }}>Copiar link</Button>
              <p className="text-xs text-muted-foreground">Envie o link diretamente ao seu pai, mãe ou tutor legal. Depois que a autorização for concluída, atualize esta página.</p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={() => {
            sessionStorage.removeItem(PENDING_SIGNUP_KEY);
            navigate("/escolher-plano", { replace: true });
          }}>
            Continuar sem informar dados de saúde
          </Button>
          <p className="text-xs text-muted-foreground">
            O responsável precisa usar uma conta adulta com e-mail confirmado e data de nascimento cadastrada. A declaração de vínculo não substitui verificação documental.
            Consulte a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full border-b border-border bg-card/50">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2 text-xs font-medium">
            <span className="text-primary">Etapa {step} de 3</span>
            <span className="text-muted-foreground">
              {step === 1 ? "Seu Corpo" : step === 2 ? "Seus Objetivos" : "Sua Saúde"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {step === 1 && (
            <StepCorpo
              initial={corpo?.raw ?? { peso: "", altura: "" }}
              dataNascimento={pending.data_nascimento}
              pais={pending.pais}
              onNext={(d) => {
                setCorpo(d);
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <StepObjetivos
              initial={objetivos}
              onBack={() => setStep(1)}
              onNext={(d) => {
                setObjetivos(d);
                setStep(3);
              }}
            />
          )}
          {step === 3 && (
            <StepSaude
              initial={saude}
              requireConsent={true}
              isMinor={requiresGuardian}
              onBack={() => setStep(2)}
              onSubmit={(d) => {
                setSaude(d);
                finish(d);
              }}
            />
          )}
          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              As informações de saúde são dados pessoais sensíveis e serão usadas para personalizar
              cardápios e alertas, conforme a base legal aplicável. Consulte a{" "}
              <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
              {" "}Para exercer seus direitos, incluindo solicitar revogação de consentimento quando
              essa for a base legal, escreva para{" "}
              <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
                privacidade@comafacil.com.br
              </a>.
              {" "}O Coma Fácil não substitui nutricionista ou médico —{" "}
              <Link to="/aviso-medico" className="text-primary underline">leia o aviso de saúde</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSaude;
