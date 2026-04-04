import { useUserPlan } from "@/hooks/useUserPlan";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PlanGateProps {
  feature: keyof ReturnType<typeof useUserPlan>["features"];
  children: React.ReactNode;
  requiredPlan?: string;
}

export function PlanGate({ feature, children, requiredPlan }: PlanGateProps) {
  const { features, loading, planLabel } = useUserPlan();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  if (!features[feature]) {
    const planNeeded = requiredPlan || "um plano superior";
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Funcionalidade bloqueada</h2>
        <p className="text-muted-foreground text-sm">
          Esta funcionalidade está disponível a partir do plano <strong>{planNeeded}</strong>.
          Você está no plano <strong>{planLabel}</strong>.
        </p>
        <Button onClick={() => navigate("/dashboard/configuracoes")} className="gap-2">
          <Crown className="h-4 w-4" />
          Ver planos
        </Button>
      </motion.div>
    );
  }

  return <>{children}</>;
}
