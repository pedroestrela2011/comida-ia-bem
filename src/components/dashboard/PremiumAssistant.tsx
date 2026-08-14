import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Send, Camera, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";

const WEEKLY_LIMIT = 30;
const GREEN = "#2d6a4f";

type Msg = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  cardapio?: any;
  saved?: boolean;
};

// Session-only history: lives while the page is loaded, wiped on reload/logout.
const session: { messages: Msg[]; welcomed: boolean } = { messages: [], welcomed: false };

function mondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nextMondayCountdown(): string {
  const now = new Date();
  const next = new Date(now);
  const day = now.getDay();
  const daysUntil = day === 0 ? 1 : 8 - day;
  next.setDate(now.getDate() + daysUntil);
  next.setHours(0, 0, 0, 0);
  const ms = next.getTime() - now.getTime();
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  return `Renova em ${dias} dia${dias === 1 ? "" : "s"} e ${horas} hora${horas === 1 ? "" : "s"}`;
}

function extractCardapio(text: string): { clean: string; cardapio: any | null } {
  const match = text.match(/```cardapio-json\s*([\s\S]*?)```/);
  if (!match) return { clean: text, cardapio: null };
  let cardapio: any = null;
  try {
    cardapio = JSON.parse(match[1].trim());
  } catch {
    cardapio = null;
  }
  return { clean: text.replace(match[0], "").trim(), cardapio };
}

export function PremiumAssistant() {
  const navigate = useNavigate();
  const { plan, isAdmin, loading } = useUserPlan();
  const isTop = isAdmin || plan === "performance";

  const [open, setOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(session.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [used, setUsed] = useState(0);
  const [countdown, setCountdown] = useState(nextMondayCountdown());
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    session.messages = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(nextMondayCountdown()), 60000);
    return () => clearInterval(t);
  }, []);

  const loadUsage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("premium_assistant_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("week_start", mondayOfCurrentWeek())
      .maybeSingle();
    setUsed((data as any)?.count ?? 0);
  }, []);

  const callAssistant = useCallback(
    async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("premium-assistant", {
        body: { ...payload, week_start: mondayOfCurrentWeek() },
      });
      if (error) {
        // Non-2xx: try to surface the backend message
        let msg = "Não foi possível falar com o assistente.";
        try {
          const ctx: any = (error as any).context;
          const parsed = ctx && typeof ctx.json === "function" ? await ctx.json() : null;
          if (parsed?.error) msg = parsed.error;
          if (parsed?.limit_reached) setUsed(WEEKLY_LIMIT);
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (typeof data?.used === "number") setUsed(data.used);
      return data as { content: string; used?: number };
    },
    [],
  );

  const openPanel = async () => {
    if (!isTop) {
      setLockOpen(true);
      return;
    }
    setOpen(true);
    loadUsage();
    if (session.welcomed) return;
    session.welcomed = true;
    setSending(true);
    try {
      const data = await callAssistant({ mode: "welcome" });
      const content = data.content?.trim();
      setMessages([{ role: "assistant", content: content || "Olá! 👋 Estou aqui para te ajudar com tudo sobre alimentação e hábitos saudáveis — personalizado para você. O que você gostaria de saber hoje?" }]);
    } catch {
      setMessages([{ role: "assistant", content: "Olá! 👋 Estou aqui para te ajudar com tudo sobre alimentação e hábitos saudáveis — personalizado para você. O que você gostaria de saber hoje?" }]);
    } finally {
      setSending(false);
    }
  };

  const remaining = Math.max(0, WEEKLY_LIMIT - used);
  const blocked = remaining <= 0;

  const toApiMessages = (list: Msg[]) =>
    list.map((m) =>
      m.image
        ? {
            role: m.role,
            content: [
              { type: "text", text: m.content || "Analise este prato." },
              { type: "image_url", image_url: { url: m.image } },
            ],
          }
        : { role: m.role, content: m.content },
    );

  const send = async (text: string, image?: string) => {
    if (sending || blocked) return;
    if (!text.trim() && !image) return;
    const userMsg: Msg = { role: "user", content: text.trim(), image };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const data = await callAssistant({ mode: "chat", messages: toApiMessages(next) });
      const { clean, cardapio } = extractCardapio(data.content || "");
      setMessages((prev) => [...prev, { role: "assistant", content: clean, cardapio }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setSending(false);
      loadUsage();
    }
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Envie uma foto de até 7MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => send("Analise este prato, por favor.", String(reader.result));
    reader.readAsDataURL(file);
  };

  const salvarCardapio = async (index: number) => {
    const msg = messages[index];
    if (!msg?.cardapio) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("cardapios_salvos")
        .insert({ user_id: user.id, dados: msg.cardapio, tipo: "normal" });
      if (error) throw error;
      setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, saved: true } : m)));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✅ Cardápio salvo com sucesso! Você pode acessá-lo em Meu Cardápio → Salvos." },
      ]);
    } catch (e: any) {
      toast({ title: "Erro ao salvar cardápio", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return null;

  const counterColor = remaining <= 3 ? "#ef4444" : remaining <= 10 ? "#f59e0b" : "#ffffff";
  const counterWarning =
    remaining <= 0
      ? null
      : remaining <= 3
        ? `🔴 Atenção! Você tem apenas ${remaining} mensagem${remaining === 1 ? "" : "ns"} restante${remaining === 1 ? "" : "s"} esta semana.`
        : remaining <= 10
          ? "⚠️ Você está chegando ao limite semanal."
          : null;

  return (
    <>
      {!open && (
        <button
          onClick={openPanel}
          aria-label="Assistente Premium"
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: GREEN }}
        >
          <Bot className="h-7 w-7" style={{ color: "#ffffff" }} />
        </button>
      )}

      {/* Plan lock modal */}
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-3 pt-2">
            <Lock className="h-10 w-10" style={{ color: "#d4af37" }} />
            <h2 className="text-lg font-bold text-foreground">Assistente Premium</h2>
            <p className="text-sm text-muted-foreground">
              Este recurso é exclusivo do Plano Top. Tenha acesso a um assistente inteligente
              especializado em alimentação que aprende sobre você durante a conversa.
            </p>
            <Button
              className="w-full mt-1 text-white"
              style={{ backgroundColor: GREEN }}
              onClick={() => {
                setLockOpen(false);
                navigate("/planos");
              }}
            >
              Fazer Upgrade →
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 inset-0 md:inset-auto md:bottom-5 md:right-5 md:w-[380px] md:h-[520px] flex flex-col overflow-hidden md:rounded-2xl shadow-2xl"
          style={{ backgroundColor: "#132b21" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 shrink-0"
            style={{ backgroundColor: GREEN }}
          >
            <Bot className="h-5 w-5 text-white" />
            <span className="font-semibold text-white text-sm flex-1">Assistente Premium</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-2 shrink-0" style={{ backgroundColor: "#1b3a2c" }}>
            <p className="text-xs font-medium" style={{ color: counterColor }}>
              💬 {remaining} de {WEEKLY_LIMIT} mensagens disponíveis esta semana
            </p>
            {counterWarning && (
              <p className="text-[11px] mt-0.5" style={{ color: counterColor }}>{counterWarning}</p>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: GREEN }}
                  >
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap text-white"
                  style={{ backgroundColor: m.role === "user" ? GREEN : "#20493a" }}
                >
                  {m.image && (
                    <img src={m.image} alt="Foto do prato enviada" className="rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  {m.content}
                  {m.cardapio && !m.saved && (
                    <button
                      onClick={() => salvarCardapio(i)}
                      className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white"
                      style={{ backgroundColor: GREEN }}
                    >
                      Salvar em Meus Cardápios →
                    </button>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2 justify-start">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: GREEN }}
                >
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl px-3 py-3 flex gap-1" style={{ backgroundColor: "#20493a" }}>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-3" style={{ backgroundColor: "#1b3a2c" }}>
            {blocked ? (
              <div className="text-center text-white/90 space-y-1">
                <Lock className="h-5 w-5 mx-auto" />
                <p className="text-[12px]">
                  Você atingiu seu limite de 30 mensagens esta semana. Seu Assistente Premium será
                  renovado na segunda-feira. Até lá! 🌿
                </p>
                <p className="text-[11px] text-white/60">{countdown}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={sending}
                  aria-label="Enviar foto do prato"
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50"
                  style={{ backgroundColor: "#20493a" }}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                  placeholder="Digite sua dúvida..."
                  disabled={sending}
                  className="h-9 border-white/15 bg-white/5 text-white placeholder:text-white/50 text-[13px]"
                />
                <button
                  onClick={() => send(input)}
                  disabled={sending || !input.trim()}
                  aria-label="Enviar mensagem"
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50"
                  style={{ backgroundColor: GREEN }}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
