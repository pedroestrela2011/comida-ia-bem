import { PLANS } from "@/data/plans";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_CONFIG, PlanType } from "@/contexts/SubscriptionContext";

const plans = PLANS.map((plan) => ({
  ...plan,
  features: plan.features.filter((feature) => feature.included).map((feature) => feature.text),
}));

const EscolherPlano = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [pending, setPending] = useState<{ nome: string; email: string } | null>(null);

  useEffect(() => {
    const loadAccount = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;
      if (authError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("nome, data_nascimento")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !profile?.data_nascimento) {
        toast({
          title: "Não foi possível validar sua conta",
          description: "Entre em contato com o suporte antes de contratar um plano.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      const birthDate = new Date(`${profile.data_nascimento}T00:00:00.000Z`);
      const today = new Date();
      let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
      if (
        today.getUTCMonth() < birthDate.getUTCMonth() ||
        (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate())
      ) age--;
      setIsMinor(age < 18);
      setPending({
        nome: profile.nome || String(user.user_metadata?.nome || ""),
        email: user.email || "",
      });
    };
    loadAccount();
  }, [navigate, toast]);

  const createAccount = async (planId: PlanType) => {
    if (isMinor) {
      toast({
        title: "Conta gratuita",
        description: "Menores de 18 anos não podem contratar planos diretamente.",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlan(planId);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PLAN_CONFIG[planId].price_id },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("O checkout não retornou um endereço válido.");
      window.location.assign(data.url);
    } catch (err: any) {
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setSelectedPlan(null);
      setLoading(false);
    }
  };

  const handleSelect = (planId: PlanType) => createAccount(planId);
  const handleSkip = () => navigate("/dashboard", { replace: true });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao cadastro
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium max-w-xs mx-auto">
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">1. Cadastro</span>
            <span className="h-px flex-1 bg-border" />
            <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground">2. Plano</span>
          </div>

          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {pending?.nome ? `Olá, ${pending.nome.split(" ")[0]}!` : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para sua jornada. Você pode mudar quando quiser.
          </p>
        </div>

        {isMinor ? (
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Conta gratuita</CardTitle>
              <CardDescription>Seu acesso gratuito permanece disponível sem prazo de teste.</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              A contratação de planos pagos deve ser feita por um responsável adulto. Você pode continuar usando a conta gratuita.
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSkip}>Continuar para minha conta</Button>
            </CardFooter>
          </Card>
        ) : (
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-primary shadow-xl md:scale-[1.03] ring-2 ring-primary/20"
                    : "hover:-translate-y-1"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Star size={12} className="fill-current" />
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelect(plan.id)}
                    disabled={loading}
                    className="w-full font-semibold"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {isSelected && loading ? "Processando..." : "Começar agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        )}

        {!isMinor && <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Ao selecionar um plano, você será direcionado ao pagamento. Sem pagar, o teste de 7 dias inclui apenas o Cardápio e 1 PDF.
          </p>
          <Button
            variant="link"
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 disabled:opacity-50"
            disabled={loading}
          >
            Continuar sem pagar — testar por 7 dias
          </Button>
        </div>}
      </div>
    </div>
  );
};

export default EscolherPlano;
