import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import LegalPage from "@/components/legal/LegalPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(255, "Máximo de 255 caracteres"),
  assunto: z.string().trim().min(1, "Informe o assunto").max(150, "Máximo de 150 caracteres"),
  mensagem: z
    .string()
    .trim()
    .min(10, "Escreva pelo menos 10 caracteres")
    .max(2000, "Máximo de 2000 caracteres"),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

const Suporte = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Errors = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as keyof Errors] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.from("support_messages").insert({
      ...parsed.data,
      user_id: sessionData.session?.user.id ?? null,
    });
    setSending(false);
    if (error) {
      toast({
        title: "Não foi possível enviar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    setSent(true);
    setForm({ nome: "", email: "", assunto: "", mensagem: "" });
  };

  return (
    <LegalPage
      title="Suporte"
      updatedAt="11 de outubro de 2026"
      intro="Precisa de ajuda ou quer tirar uma dúvida? Envie sua mensagem pelo formulário abaixo e nossa equipe responderá o mais breve possível."
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto text-primary" size={40} />
          <h2 className="font-display text-xl font-bold text-foreground">Mensagem enviada</h2>
          <p className="text-muted-foreground">
            Recebemos sua mensagem e responderemos no e-mail informado.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Enviar outra mensagem
          </Button>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                maxLength={100}
                onChange={(e) => update("nome", e.target.value)}
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                maxLength={255}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={form.assunto}
              maxLength={150}
              onChange={(e) => update("assunto", e.target.value)}
            />
            {errors.assunto && <p className="text-sm text-destructive">{errors.assunto}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              rows={6}
              value={form.mensagem}
              maxLength={2000}
              onChange={(e) => update("mensagem", e.target.value)}
            />
            <div className="flex justify-between text-sm">
              <span className="text-destructive">{errors.mensagem}</span>
              <span className="text-muted-foreground">{form.mensagem.length}/2000</span>
            </div>
          </div>
          <Button type="submit" disabled={sending} className="w-full md:w-auto">
            {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Enviar mensagem
          </Button>
        </form>
      )}
    </LegalPage>
  );
};

export default Suporte;
