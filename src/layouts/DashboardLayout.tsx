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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
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
