import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const countries = [
  "Brasil", "Portugal", "Angola", "Moçambique", "Cabo Verde",
  "Estados Unidos", "Espanha", "França", "Alemanha", "Itália",
  "Argentina", "Chile", "Colômbia", "México", "Japão",
];

export const PENDING_SIGNUP_KEY = "pending_signup_v1";

const Cadastro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    dia: "",
    mes: "",
    ano: "",
    pais: "",
    email: "",
    senha: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [checkingPassword, setCheckingPassword] = useState(false);

  const isPasswordPwned = async (password: string): Promise<boolean> => {
    try {
      const buf = await crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(password)
      );
      const hash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) return false;
      const text = await res.text();
      return text.split("\n").some((line) => line.split(":")[0].trim() === suffix);
    } catch {
      return false;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.dia || !form.mes || !form.ano) e.nascimento = "Data de nascimento é obrigatória";
    if (!form.pais) e.pais = "Selecione seu país";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (form.senha.length < 6) {
      e.senha = "Senha deve ter pelo menos 6 caracteres";
    } else if (
      form.senha.length < 8 ||
      !/[A-Za-z]/.test(form.senha) ||
      !/[0-9]/.test(form.senha)
    ) {
      e.senha = "Senha fraca. Use ao menos 8 caracteres, com letras e números.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Verifique os dados",
        description: "Alguns campos precisam ser corrigidos.",
        variant: "destructive",
      });
      return;
    }

    setCheckingPassword(true);
    const pwned = await isPasswordPwned(form.senha);
    setCheckingPassword(false);
    if (pwned) {
      setErrors((prev) => ({
        ...prev,
        senha:
          "Esta senha aparece em vazamentos conhecidos e é fácil de adivinhar. Escolha outra.",
      }));
      toast({
        title: "Senha insegura",
        description: "Escolha uma senha diferente para continuar.",
        variant: "destructive",
      });
      return;
    }

    const dataNascimento = `${form.ano}-${form.mes.padStart(2, "0")}-${form.dia.padStart(2, "0")}`;

    sessionStorage.setItem(
      PENDING_SIGNUP_KEY,
      JSON.stringify({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        data_nascimento: dataNascimento,
        pais: form.pais,
      })
    );

    navigate("/escolher-plano");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-green-600 to-green-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 12}%`,
                opacity: 0.15 - i * 0.02,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-primary-foreground font-bold text-3xl font-display">N</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-4">
            Bem-vindo ao ComaFacil
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Sua jornada para uma alimentação mais saudável, gostosa e sem complicação começa aqui.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">ComaFacil</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground">1. Cadastro</span>
            <span className="h-px flex-1 bg-border" />
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">2. Plano</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Crie sua conta
          </h2>
          <p className="text-muted-foreground mb-8">
            Preencha seus dados para começar
          </p>

          <form onSubmit={handleNext} className="space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>

            {/* Data de nascimento */}
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.dia} onValueChange={(v) => setForm({ ...form, dia: v })}>
                  <SelectTrigger className={errors.nascimento ? "border-destructive" : ""}>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.mes} onValueChange={(v) => setForm({ ...form, mes: v })}>
                  <SelectTrigger className={errors.nascimento ? "border-destructive" : ""}>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.ano} onValueChange={(v) => setForm({ ...form, ano: v })}>
                  <SelectTrigger className={errors.nascimento ? "border-destructive" : ""}>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.nascimento && <p className="text-sm text-destructive">{errors.nascimento}</p>}
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={form.pais} onValueChange={(v) => setForm({ ...form, pais: v })}>
                <SelectTrigger className={errors.pais ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione seu país" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pais && <p className="text-sm text-destructive">{errors.pais}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
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
              {errors.senha && <p className="text-sm text-destructive">{errors.senha}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={checkingPassword}
              className="w-full font-semibold text-base gap-2 h-12"
            >
              {checkingPassword ? "Verificando senha..." : "Próximo"}
              {!checkingPassword && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Já tem conta?</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full font-semibold text-base h-12 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link to="/login">Fazer login na minha conta</Link>
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos termos e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
