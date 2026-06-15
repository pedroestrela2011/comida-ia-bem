import { CalendarDays, ChefHat, MessageCircle, Settings, LogOut, Leaf, Dumbbell, TrendingUp, UtensilsCrossed, Star, Trophy, Lock, ShieldCheck, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

type FeatureKey = "cardapio" | "receitas" | "chat" | "modoEsporte" | "progresso" | "analisadorPrato" | "scoreDiario" | "conquistas";

const menuItems: { title: string; url: string; icon: any; featureKey?: FeatureKey }[] = [
  { title: "Meu Cardápio", url: "/dashboard/cardapio", icon: CalendarDays },
  { title: "Score Diário", url: "/dashboard/score", icon: Star, featureKey: "scoreDiario" },
  { title: "Conquistas", url: "/dashboard/conquistas", icon: Trophy, featureKey: "conquistas" },
  { title: "Modo Esporte", url: "/dashboard/modo-esporte", icon: Dumbbell, featureKey: "modoEsporte" },
  { title: "Receitas", url: "/dashboard/receitas", icon: ChefHat },
  { title: "Favoritos", url: "/dashboard/favoritos", icon: Heart },
  { title: "Analisador de Prato", url: "/dashboard/analisador-prato", icon: UtensilsCrossed, featureKey: "analisadorPrato" },
  { title: "Meu Progresso", url: "/dashboard/progresso", icon: TrendingUp, featureKey: "progresso" },
  { title: "Conversa Saudável", url: "/dashboard/chat", icon: MessageCircle },
  { title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { features, isAdmin } = useUserPlan();
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Você saiu da sua conta." });
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">NutriPlus</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const locked = item.featureKey ? !features[item.featureKey] : false;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-2 ${locked ? "opacity-60" : ""}`}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.url === "/dashboard/receitas-recebidas" && unreadCount > 0 && (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {unreadCount}
                          </span>
                        )}
                        {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/admin"
                      className="flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Gerenciar admins</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
