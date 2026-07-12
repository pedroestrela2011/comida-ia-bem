import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PENDING_SIGNUP_KEY } from "./Cadastro";
import { StepCorpo, CorpoData } from "@/components/onboarding/StepCorpo";
import { StepObjetivos, ObjetivosData } from "@/components/onboarding/StepObjetivos";
import { StepSaude, SaudeData } from "@/components/onboarding/StepSaude";
import { calcIMC } from "@/lib/health";

type PendingSignup = {
  nome: string;
  email: string;
  senha: string;
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

  const finish = (dSaude: SaudeData) => {
    if (!pending || !corpo) return;
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
    sessionStorage.setItem(
      PENDING_SIGNUP_KEY,
      JSON.stringify({ ...pending, health }),
    );
    navigate("/escolher-plano");
  };

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
          {step === 3 && (
            <StepSaude
              initial={saude}
              onBack={() => setStep(2)}
              onSubmit={(d) => {
                setSaude(d);
                finish(d);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSaude;
