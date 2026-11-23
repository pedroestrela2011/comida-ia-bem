import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_CONFIG, PLANS } from "@/data/plans";
import { PlanType } from "@/contexts/SubscriptionContext";

const ResponsavelContratar = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [plan, setPlan] = useState<PlanType>("essencial");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast({ title: "Link inválido", description: "Peça um novo link ao titular da conta.", variant: "destructive" });
      return;
    }
    if (!confirmed) {
      toast({ title: "Confirmação necessária", description: "Confirme que você é o responsável adulto pela contratação.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("guardian-checkout", {
        body: {
          token,
          guardianName,
          guardianEmail,
          priceId: PLAN_CONFIG[plan].price_id,
          responsibleAdultConfirmed: confirmed,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("O checkout não retornou um endereço válido.");
      window.location.assign(data.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "O link pode ter expirado. Peça outro link ao titular da conta.";
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Contratação por responsável adulto</CardTitle>
          <CardDescription>
            Preencha seus dados para contratar um plano para a conta adolescente vinculada ao convite.
            Não é necessário criar uma conta ComaFacil.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCheckout}>
          <CardContent className="space-y-5">
            {!token ? (
              <p className="text-sm text-destructive">Este link não contém um convite válido. Solicite um novo link ao titular da conta.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guardian-name">Nome completo do responsável</Label>
                  <Input id="guardian-name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} autoComplete="name" required minLength={3} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian-email">Email do responsável</Label>
                  <Input id="guardian-email" type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} autoComplete="email" required maxLength={254} />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={plan} onValueChange={(value) => setPlan(value as PlanType)}>
                    <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((availablePlan) => (
                        <SelectItem key={availablePlan.id} value={availablePlan.id}>
                          {availablePlan.name} — R$ {availablePlan.price}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <Checkbox id="responsible-confirmation" checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />
                  <Label htmlFor="responsible-confirmation" className="text-sm leading-relaxed">
                    Declaro ser maior de 18 anos, pai/mãe ou responsável legal pelo adolescente vinculado ao convite, e autorizo esta contratação e o pagamento.
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta etapa registra sua declaração e seus dados de contratação. Ela não realiza verificação documental do vínculo familiar ou da autoridade legal.
                </p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? "Preparando pagamento..." : "Continuar para pagamento seguro"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
};

export default ResponsavelContratar;
