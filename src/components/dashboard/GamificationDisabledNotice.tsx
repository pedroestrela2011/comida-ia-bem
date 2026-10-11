import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function GamificationDisabledNotice() {
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    let active = true;

    const checkPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("gamificacao_ativa")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active && !error && data) {
        setDisabled(data.gamificacao_ativa !== true);
      }
    };

    void checkPreference();
    return () => { active = false; };
  }, []);

  if (!disabled) return null;

  return (
    <Alert className="border-primary/30 bg-primary/10">
      <Sprout className="h-5 w-5" />
      <AlertTitle className="leading-snug tracking-normal">
        Jornada de Evolução desativada
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          O modo Jornada de Evolução está desativado. Para ativá-lo, acesse as
          Configurações do site e habilite a Jornada de Evolução na aba Aparência.
        </p>
        <Button asChild size="sm">
          <Link to="/dashboard/configuracoes">
            <Settings className="h-4 w-4" />
            Ir para Configurações
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}