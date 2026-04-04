import { useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScoreReminders } from "@/components/dashboard/ScoreReminders";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { toast } from "@/hooks/use-toast";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle checkout callback
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({ title: "Assinatura realizada com sucesso! 🎉", description: "Seu plano foi atualizado." });
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <SubscriptionProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border px-3 md:px-4 shrink-0">
              <SidebarTrigger />
            </header>
            <div className="flex-1 p-3 md:p-6 overflow-auto">
              <ScoreReminders />
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </SubscriptionProvider>
  );
}
