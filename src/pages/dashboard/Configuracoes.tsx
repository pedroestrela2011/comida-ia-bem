import { useState, useEffect, useRef } from "react";
import { Settings, User, Shield, Moon, Sun, Camera, Loader2, Eye, EyeOff, ShieldCheck, Crown, Star, Zap, Check, X, Bell, Sparkles, HeartPulse } from "lucide-react";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import { CONDICOES_OPCOES, NIVEIS_ATIVIDADE, OBJETIVOS, REFEICOES_OPCOES, RESTRICOES_OPCOES, faixaIMC, calcIMC } from "@/lib/health";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription, PLAN_CONFIG } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";
import { WelcomeGamificationDialog } from "@/components/dashboard/WelcomeGamificationDialog";

const countries = [
  "Brasil", "Portugal", "Angola", "Moçambique", "Cabo Verde",
  "Estados Unidos", "Espanha", "França", "Alemanha", "Itália",
  "Argentina", "Chile", "Colômbia", "México", "Japão",
];

type Profile = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  pais: string | null;
  avatar_url: string | null;
  tema: string;
  two_fa_enabled: boolean;
};

export default function Configuracoes() {
  const [tab, setTab] = useState("perfil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [pais, setPais] = useState("");

  // Security
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  const [notificacoesScore, setNotificacoesScore] = useState(true);

  // Gamification
  const { enabled: gamiEnabled, onboarded: gamiOnboarded, setEnabled: setGamiEnabled, markOnboarded } = useGamification();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      const p = data as unknown as Profile;
      setProfile(p);
      setNome(p.nome || "");
      setPais(p.pais || "");

      if (p.data_nascimento) {
        const d = new Date(p.data_nascimento + "T00:00:00");
        setDia(String(d.getDate()));
        setMes(String(d.getMonth() + 1));
        setAno(String(d.getFullYear()));
      }

      if (p.tema === "dark") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }

      setNotificacoesScore((data as any)?.notificacoes_score ?? true);
    } catch (e: any) {
      console.error("Erro ao carregar perfil:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl + "?t=" + Date.now();
      }

      const dataNascimento = dia && mes && ano
        ? `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
        : profile.data_nascimento;

      const { error } = await supabase
        .from("profiles")
        .update({
          nome,
          pais: pais || null,
          data_nascimento: dataNascimento,
          avatar_url: avatarUrl,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update email if changed
      if (email !== (await supabase.auth.getUser()).data.user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast({ title: "Email de confirmação enviado", description: "Verifique sua caixa de entrada para confirmar a alteração." });
      }

      setProfile({ ...profile, nome, pais, data_nascimento: dataNascimento, avatar_url: avatarUrl });
      setAvatarFile(null);
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (novaSenha.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });
      if (signInError) {
        toast({ title: "Senha atual incorreta", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      toast({ title: "Senha alterada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const toggle2FA = async () => {
    if (!profile) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newVal = !profile.two_fa_enabled;
      const { error } = await supabase
        .from("profiles")
        .update({ two_fa_enabled: newVal } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      setProfile({ ...profile, two_fa_enabled: newVal });
      toast({ title: newVal ? "Verificação em duas etapas ativada" : "Verificação em duas etapas desativada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const toggleDarkMode = async (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("comafacil-tema", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("comafacil-tema", "light");
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ tema: enabled ? "dark" : "light" } as any)
        .eq("user_id", user.id);
    } catch (e: any) {
      console.error("Erro ao salvar tema:", e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarSrc = avatarPreview || profile?.avatar_url || undefined;
  const initials = nome ? nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="perfil" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="saude" className="gap-1.5">
            <HeartPulse className="h-3.5 w-3.5" /> Saúde
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Segurança
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1.5">
            {darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} Aparência
          </TabsTrigger>
          <TabsTrigger value="planos" className="gap-1.5">
            <Crown className="h-3.5 w-3.5" /> Planos
          </TabsTrigger>
        </TabsList>

        {/* ========== MEU PERFIL ========== */}
        <TabsContent value="perfil" className="space-y-6 mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{nome || "Seu nome"}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <button onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:underline mt-1">
                  Alterar foto
                </button>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>

            {/* Data de nascimento */}
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={dia} onValueChange={setDia}>
                  <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger><SelectValue placeholder="Selecione seu país" /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
              <p className="text-xs text-muted-foreground">Alterar o email requer confirmação por email.</p>
            </div>

            <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : "Salvar alterações"}
            </Button>
          </div>
        </TabsContent>

        {/* ========== DADOS DE SAÚDE ========== */}
        <TabsContent value="saude" className="space-y-6 mt-6">
          <DadosSaudeTab />
        </TabsContent>

        {/* ========== SEGURANÇA ========== */}
        <TabsContent value="seguranca" className="space-y-6 mt-6">
          {/* Alterar senha */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Alterar Senha
            </h2>

            <div className="space-y-2">
              <Label>Senha atual</Label>
              <div className="relative">
                <Input
                  type={showSenhaAtual ? "text" : "password"}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSenhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>

            <Button onClick={changePassword} disabled={changingPassword || !senhaAtual || !novaSenha}>
              {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Alterando...</> : "Alterar senha"}
            </Button>
          </div>

          {/* 2FA */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Verificação em Duas Etapas
            </h2>
            <p className="text-sm text-muted-foreground">
              Quando ativada, ao fazer login você receberá um código de verificação no seu email. 
              Esse código deverá ser inserido para concluir o acesso, adicionando uma camada extra de segurança à sua conta.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <p className="font-medium text-foreground">
                  {profile?.two_fa_enabled ? "Ativada" : "Desativada"}
                </p>
                <p className="text-xs text-muted-foreground">Verificação por email</p>
              </div>
              <Switch checked={profile?.two_fa_enabled || false} onCheckedChange={toggle2FA} />
            </div>
          </div>
        </TabsContent>

        {/* ========== APARÊNCIA ========== */}
        <TabsContent value="aparencia" className="space-y-6 mt-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              Modo Escuro
            </h2>
            <p className="text-sm text-muted-foreground">
              Alterne entre o modo claro e escuro. A mudança é aplicada imediatamente e sua preferência é salva automaticamente.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? "bg-muted" : "bg-primary/10"}`}>
                  {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{darkMode ? "Modo Escuro" : "Modo Claro"}</p>
                  <p className="text-xs text-muted-foreground">{darkMode ? "Tema escuro ativado" : "Tema claro ativado"}</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>

          {/* Notificações do Score */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Lembretes do Score Diário
            </h2>
            <p className="text-sm text-muted-foreground">
              Receba lembretes inteligentes no dashboard quando puder melhorar seu score ou estiver prestes a perder seu streak.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${notificacoesScore ? "bg-primary/10" : "bg-muted"}`}>
                  <Bell className={`h-5 w-5 ${notificacoesScore ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{notificacoesScore ? "Ativados" : "Desativados"}</p>
                  <p className="text-xs text-muted-foreground">Lembretes no dashboard</p>
                </div>
              </div>
              <Switch
                checked={notificacoesScore}
                onCheckedChange={async (checked) => {
                  setNotificacoesScore(checked);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase
                      .from("profiles")
                      .update({ notificacoes_score: checked } as any)
                      .eq("user_id", user.id);
                    toast({ title: checked ? "Lembretes ativados" : "Lembretes desativados" });
                  } catch (e: any) {
                    toast({ title: "Erro", description: e.message, variant: "destructive" });
                    setNotificacoesScore(!checked);
                  }
                }}
              />
            </div>
          </div>

          {/* Jornada de Evolução */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Jornada de Evolução
            </h2>
            <p className="text-sm text-muted-foreground">
              Sistema opcional de XP, níveis e conquistas. Quando ativado, cada ação sua na plataforma
              acumula pontos e desbloqueia badges. Se desativar, seu progresso é mantido e volta de onde parou.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${gamiEnabled ? "bg-primary/10" : "bg-muted"}`}>
                  <Sparkles className={`h-5 w-5 ${gamiEnabled ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{gamiEnabled ? "Ativada" : "Desativada"}</p>
                  <p className="text-xs text-muted-foreground">Acumule XP e desbloqueie conquistas</p>
                </div>
              </div>
              <Switch
                checked={!!gamiEnabled}
                onCheckedChange={async (checked) => {
                  await setGamiEnabled(checked);
                  if (checked && !gamiOnboarded) setShowWelcome(true);
                  toast({ title: checked ? "Jornada de Evolução ativada" : "Jornada de Evolução desativada" });
                }}
              />
            </div>
          </div>
        </TabsContent>
        <WelcomeGamificationDialog
          open={showWelcome}
          onConfirm={async () => { setShowWelcome(false); await markOnboarded(); }}
        />


        {/* ========== PLANOS ========== */}
        <TabsContent value="planos" className="space-y-6 mt-6">
          <PlanosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DadosSaudeTab() {
  const { profile, loading, update } = useHealthProfile();
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [refeicoes, setRefeicoes] = useState<number | null>(null);
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [alergias, setAlergias] = useState("");
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [outras, setOutras] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPeso(profile.peso_kg ? String(profile.peso_kg) : "");
    setAltura(profile.altura_cm ? String(profile.altura_cm) : "");
    setObjetivo(profile.objetivo || "");
    setNivel(profile.nivel_atividade || "");
    setRefeicoes(profile.refeicoes_dia ?? null);
    setRestricoes(profile.restricoes_alimentares || []);
    setAlergias(profile.alergias || "");
    setCondicoes(profile.condicoes_saude || []);
    setOutras(profile.condicoes_outras || "");
  }, [profile]);

  const toggleArr = (arr: string[], val: string) => {
    if (val === "Nenhuma") return ["Nenhuma"];
    const without = arr.filter((v) => v !== "Nenhuma");
    return without.includes(val) ? without.filter((v) => v !== val) : [...without, val];
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const pesoNum = parseFloat(peso.replace(",", "."));
      const alturaNum = parseFloat(altura.replace(",", "."));
      await update({
        peso_kg: isNaN(pesoNum) ? null : pesoNum,
        altura_cm: isNaN(alturaNum) ? null : alturaNum,
        objetivo: objetivo || null,
        nivel_atividade: nivel || null,
        refeicoes_dia: refeicoes,
        restricoes_alimentares: restricoes,
        alergias: alergias || null,
        condicoes_saude: condicoes,
        condicoes_outras: outras || null,
      });
      toast({ title: "Dados de saúde atualizados!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const imcCalc = peso && altura ? calcIMC(parseFloat(peso.replace(",", ".")), parseFloat(altura.replace(",", "."))) : profile?.imc ?? null;
  const faixa = faixaIMC(imcCalc);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" /> Dados de Saúde
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Atualize suas informações a qualquer momento. As mudanças são usadas em todas as funções do site.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Altura (cm)</Label>
          <Input inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>IMC</Label>
          <div className="h-10 rounded-md border border-border bg-muted/30 px-3 flex items-center justify-between">
            <span className="font-semibold text-foreground">{imcCalc ?? "—"}</span>
            <span className={`text-xs font-medium ${faixa.color}`}>{faixa.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Objetivo principal</Label>
        <Select value={objetivo} onValueChange={setObjetivo}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {OBJETIVOS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nível de atividade</Label>
        <Select value={nivel} onValueChange={setNivel}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {NIVEIS_ATIVIDADE.map((n) => (<SelectItem key={n.value} value={n.value}>{n.value}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Refeições por dia</Label>
        <div className="flex gap-2">
          {REFEICOES_OPCOES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRefeicoes(n)}
              className={`h-10 w-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                refeicoes === n
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Restrições alimentares</Label>
        <div className="flex flex-wrap gap-2">
          {RESTRICOES_OPCOES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRestricoes(toggleArr(restricoes, r))}
              className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition-all ${
                restricoes.includes(r)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Alergias</Label>
        <Textarea rows={2} value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Descreva alergias, se houver" />
      </div>

      <div className="space-y-2">
        <Label>Condições de saúde</Label>
        <div className="flex flex-wrap gap-2">
          {CONDICOES_OPCOES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCondicoes(toggleArr(condicoes, c))}
              className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition-all ${
                condicoes.includes(c)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {condicoes.includes("Outras") && (
          <Input placeholder="Especifique" value={outras} onChange={(e) => setOutras(e.target.value)} />
        )}
      </div>

      <Button onClick={salvar} disabled={saving}>
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : "Salvar dados de saúde"}
      </Button>
    </div>
  );
}

const plansData = [
  {
    id: "essencial",
    name: "Essencial",
    price: "19,90",
    description: "Comece sua jornada com o básico",
    icon: Zap,
    features: [
      { text: "Cardápios semanais completos", included: true },
      { text: "Até 3 cardápios por conta", included: true },
      { text: "Lista de compras automática", included: true },
      { text: "Criação de receitas com IA", included: true },
      { text: "Chatbot com limite de uso", included: true },
      { text: "Marcar refeições como concluídas", included: false },
      { text: "Score Diário e Conquistas", included: false },
      { text: "Modo Esporte", included: false },
      { text: "Analisador de Prato", included: false },
    ],
  },
  {
    id: "equilibrio",
    name: "Equilíbrio",
    price: "27,90",
    description: "Melhor custo-benefício",
    icon: Star,
    popular: true,
    features: [
      { text: "Cardápios ilimitados", included: true },
      { text: "Lista de compras completa", included: true },
      { text: "Marcar refeições como concluídas", included: true },
      { text: "Analisador de Prato completo", included: true },
      { text: "Rastreador de Progresso", included: true },
      { text: "Modo Esporte completo", included: true },
      { text: "Chatbot ilimitado", included: true },
      { text: "Feedback nutricional automático", included: true },
      { text: "Score Diário e Conquistas", included: false },
    ],
  },
  {
    id: "performance",
    name: "Performance",
    price: "35,90",
    description: "Desbloqueie todo o potencial",
    icon: Crown,
    features: [
      { text: "Tudo do Equilíbrio", included: true },
      { text: "Score Diário, streak e níveis", included: true },
      { text: "Sistema de Conquistas completo", included: true },
      { text: "Sugestões nutricionais avançadas", included: true },
      { text: "Ajuste automático de cardápio", included: true },
      { text: "Insights personalizados com IA", included: true },
      { text: "Prioridade no chatbot", included: true },
      { text: "Acesso antecipado a novidades", included: true },
    ],
  },
];

function PlanosTab() {
  const { plan: currentPlan, subscribed, subscriptionEnd, loading: subLoading, refreshSubscription } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  const handleCheckout = async (planId: string) => {
    if (planId === currentPlan) return;
    setCheckingOut(planId);
    try {
      const config = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: config.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Erro ao iniciar checkout", description: e.message, variant: "destructive" });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setManagingPortal(false);
    }
  };

  const current = plansData.find(p => p.id === currentPlan);

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {current && <current.icon className="h-6 w-6 text-primary" />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Seu plano atual</p>
          <p className="text-xl font-bold text-foreground">{current?.name}</p>
          <p className="text-sm text-muted-foreground">R$ {current?.price}/mês</p>
          {subscriptionEnd && (
            <p className="text-xs text-muted-foreground mt-1">
              Próxima cobrança: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1 rounded-full text-center">
            {subscribed ? "Ativo" : "Gratuito"}
          </span>
          {subscribed && (
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={managingPortal}>
              {managingPortal ? <Loader2 className="h-3 w-3 animate-spin" /> : "Gerenciar"}
            </Button>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={() => refreshSubscription()}>
        Atualizar status da assinatura
      </Button>

      {/* Plans grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {plansData.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const isCheckingOut = checkingOut === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 space-y-4 transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {plan.popular && (
                <span className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-0.5 rounded-full">
                  Mais Popular
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">R$ </span>
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground/80" : "text-muted-foreground line-through"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "secondary" : "default"}
                className="w-full"
                disabled={isCurrent || !!checkingOut}
                onClick={() => handleCheckout(plan.id)}
              >
                {isCheckingOut ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecionando...</>
                ) : isCurrent ? (
                  "Plano atual"
                ) : (
                  "Assinar este plano"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Pagamento seguro via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  );
}
