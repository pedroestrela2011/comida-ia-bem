import { useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScoreReminders } from "@/components/dashboard/ScoreReminders";
import { SubscriptionProvider, useSubscription } from "@/contexts/SubscriptionContext";
import { TrialExpired } from "@/components/dashboard/TrialExpired";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { toast } from "@/hooks/use-toast";
import { clearLocalAuthSession, isStaleAuthSessionError } from "@/lib/auth-session";

function DashboardShell() {
  const { trialExpired, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  if (trialExpired) {
    return <TrialExpired />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-3 md:px-4 shrink-0">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-3 md:p-6 overflow-auto">
            <TrialBanner />
            <ScoreReminders />
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({ title: "Assinatura realizada com sucesso!", description: "Seu plano foi atualizado." });
    }
  }, [searchParams]);

  useEffect(() => {
    const redirectToLogin = async (showExpiredMessage = false) => {
      await clearLocalAuthSession();
      if (showExpiredMessage) {
        toast({
          title: "Sessão expirada",
          description: "Entre novamente para acessar o dashboard.",
        });
      }
      navigate("/login", { replace: true });
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        await redirectToLogin();
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user && (!error || isStaleAuthSessionError(error))) {
        await redirectToLogin(Boolean(error));
        return;
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <SubscriptionProvider>
      <DashboardShell />
    </SubscriptionProvider>
  );
}
