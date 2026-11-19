import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  health?: any;
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

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) {
      toast({ title: "Complete seu cadastro primeiro" });
      navigate("/cadastro", { replace: true });
      return;
    }
    try {
      setPending(JSON.parse(raw));
    } catch {
      navigate("/cadastro", { replace: true });
    }
  }, [navigate, toast]);

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
      p_policy_version: "2026-11-19",
      p_consent_text: consentText,
      p_confirm_consent: true,
    });
    if (error) {
      toast({
        title: "Não foi possível salvar seus dados",
        description: error.message?.includes("responsável")
        ? "Para menores de 18 anos, o cadastro de dados de saúde exige autorização do responsável. Esse fluxo ainda não está disponível."
        : "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.removeItem(PENDING_SIGNUP_KEY);
    // The plan page shows a permanent free tier and guardian invitation to minors.
    navigate("/escolher-plano", { replace: true });
  };

  const isMinor = (() => {
    if (!pending?.data_nascimento) return false;
    const birth = new Date(`${pending.data_nascimento}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday = today.getMonth() < birth.getMonth()
      || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 12 && age < 18;
  })();

  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;

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
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {step === 1 && (
            <StepCorpo
              initial={corpo?.raw ?? { peso: "", altura: "" }}
              dataNascimento={pending?.data_nascimento}
              pais={pending?.pais}
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
          {step === 3 && isMinor && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Etapa de saúde opcional</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Como você tem menos de 18 anos, não vamos solicitar sua autorização individual para tratar dados de saúde. Você pode continuar sem preencher nem salvar peso, altura, alergias ou condições de saúde. Um fluxo específico de autorização do responsável será necessário antes de ativar esses recursos.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                <Button type="button" className="flex-1" onClick={() => {
                  sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                  navigate("/escolher-plano", { replace: true });
                }}>Continuar sem dados de saúde</Button>
              </div>
            </div>
          )}
          {step === 3 && !isMinor && (
            <StepSaude
              initial={saude}
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
              <Link to="/privacidade" className="text-primary underline">
                Política de Privacidade
              </Link>
              . Para exercer seus direitos, incluindo solicitar revogação de consentimento quando
              essa for a base legal, escreva para{" "}
              <a href="mailto:privacidade@comafacil.com.br" className="text-primary underline">
                privacidade@comafacil.com.br
              </a>
              . O ComaFacil não substitui nutricionista ou médico —{" "}
              <Link to="/aviso-medico" className="text-primary underline">
                leia o aviso de saúde
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSaude;
