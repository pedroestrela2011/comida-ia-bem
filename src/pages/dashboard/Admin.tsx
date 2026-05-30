import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Trash2, UserPlus, Loader2 } from "lucide-react";

interface AdminRow {
  user_id: string;
  email: string | null;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, loading: planLoading } = useUserPlan();
  const [email, setEmail] = useState("");
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-roles", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast({ title: "Erro ao carregar", description: data?.error ?? error?.message, variant: "destructive" });
    } else {
      setAdmins(data.admins ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (planLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Acesso restrito</h2>
        <p className="text-muted-foreground text-sm">Esta área é exclusiva para administradores.</p>
      </div>
    );
  }

  const grant = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("admin-roles", {
      body: { action: "grant", email: email.trim() },
    });
    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error ?? error?.message, variant: "destructive" });
    } else {
      toast({ title: "Administrador adicionado" });
      setEmail("");
      load();
    }
    setSubmitting(false);
  };

  const revoke = async (targetEmail: string | null) => {
    if (!targetEmail) return;
    if (!confirm(`Remover acesso de admin de ${targetEmail}?`)) return;
    const { data, error } = await supabase.functions.invoke("admin-roles", {
      body: { action: "revoke", email: targetEmail },
    });
    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error ?? error?.message, variant: "destructive" });
    } else {
      toast({ title: "Acesso removido" });
      load();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Administração</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Conceda ou remova o papel de <strong>administrador</strong> informando o e-mail da conta.
        Administradores têm acesso completo ao site, ignorando limites de plano e período de avaliação.
      </p>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Promover usuário a administrador</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="usuario@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && grant()}
          />
          <Button onClick={grant} disabled={submitting || !email.trim()} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Promover
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O usuário precisa já estar cadastrado no site.
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Administradores atuais ({admins.length})</h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum admin cadastrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((a) => (
              <li key={a.user_id} className="flex items-center justify-between py-3 gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.email ?? "(e-mail desconhecido)"}</div>
                  <div className="text-xs text-muted-foreground">Desde {new Date(a.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => revoke(a.email)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
