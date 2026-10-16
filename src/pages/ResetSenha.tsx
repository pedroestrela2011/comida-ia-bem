import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PasswordStrength from "@/components/PasswordStrength";
import { checkPassword, PASSWORD_HINT, PASSWORD_PLACEHOLDER } from "@/lib/password";

const ResetSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [form, setForm] = useState({ senha: "", confirmar: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // O link do email abre uma sessão de recuperação (type=recovery no hash).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkValido(true);
        setVerificando(false);
      }
    });

    // Se a sessão de recuperação já existir (ex.: hash já processado), libera o formulário.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLinkValido(true);
      }
      setVerificando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!checkPassword(form.senha).valid) e.senha = PASSWORD_HINT;
    if (form.confirmar !== form.senha) e.confirmar = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: form.senha });

    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      let description = "Não foi possível atualizar a senha. Tente novamente.";
      if (msg.includes("same password")) {
        description = "A nova senha não pode ser igual à senha anterior.";
      } else if (msg.includes("weak") || msg.includes("pwned") || msg.includes("compromised")) {
        description = "Essa senha é fraca ou já vazou na internet. Escolha uma senha mais forte.";
      }
      toast({ title: "Erro ao redefinir senha", description, variant: "destructive" });
      return;
    }

    toast({ title: "Senha atualizada com sucesso!" });
    navigate("/dashboard", { replace: true });
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Verificando link de recuperação...</p>
      </div>
    );
  }

  if (!linkValido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Link inválido ou expirado
          </h2>
          <p className="text-muted-foreground">
            Este link de recuperação não é mais válido. Solicite um novo link para redefinir
            sua senha.
          </p>
          <Button asChild size="lg" className="w-full font-semibold text-base">
            <Link to="/recuperar-senha">Solicitar novo link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">ComaFacil</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Criar nova senha
        </h2>
        <p className="text-muted-foreground mb-8">
          Identidade confirmada! Agora escolha sua nova senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder={PASSWORD_PLACEHOLDER}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className={errors.senha ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrength password={form.senha} />
            {errors.senha && <p className="text-sm text-destructive">{errors.senha}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar nova senha</Label>
            <Input
              id="confirmar"
              type={showPassword ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
              className={errors.confirmar ? "border-destructive" : ""}
            />
            {errors.confirmar && <p className="text-sm text-destructive">{errors.confirmar}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full font-semibold text-base" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetSenha;
