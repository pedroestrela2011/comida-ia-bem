import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function TrialBanner() {
  const { plan, subscribed, daysLeftInTrial } = useSubscription();
  const navigate = useNavigate();

  if (subscribed || plan !== "essencial" || daysLeftInTrial === null) return null;
  if (daysLeftInTrial > 3) return null;

  const text =
    daysLeftInTrial === 0
      ? "Seu período gratuito termina hoje"
      : daysLeftInTrial === 1
      ? "Falta 1 dia do seu período gratuito"
      : `Faltam ${daysLeftInTrial} dias do seu período gratuito`;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <Clock className="h-4 w-4 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">{text}</p>
      <button
        onClick={() => navigate("/dashboard/configuracoes")}
        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
      >
        Assinar <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
