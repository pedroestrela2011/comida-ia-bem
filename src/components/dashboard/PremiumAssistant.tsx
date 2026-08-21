import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Send, Camera, Lock, Loader2, History, MessageCircle, Trash2, ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";

const WEEKLY_LIMIT = 30;
const GREEN = "#2d6a4f";
const GREEN_DARK = "#1a4731";
const GREEN_SOFT = "#f0f7f0";
const PANEL_BORDER = "#e2e8f0";
const ASSISTANT_BG = "#f8fafc";
const TEXT_DARK = "#1e293b";
const HISTORY_KEY = "premium_assistant_history_v1";
const HISTORY_LIMIT = 5;

type Msg = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  cardapio?: any;
  cardapioTipo?: "normal" | "esporte";
  receita?: any;
  analise?: any;
  saved?: boolean;
  savedReceita?: boolean;
  favorited?: boolean;
  conflict?: boolean;
  options?: string[];
  grid?: boolean;
};

type SavedConversa = { id: number; created_at: string; titulo: string; messages: Msg[] };

const RECEITAS_STORAGE_KEY = "saved_recipes_v1";
export const ANALISE_HANDOFF_KEY = "assistant_analise_handoff_v1";

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

function extractBlock(text: string, tag: string): { clean: string; data: any | null } {
  const re = new RegExp("```" + tag + "\\s*([\\s\\S]*?)```");
  const match = text.match(re);
  if (!match) return { clean: text, data: null };
  let data: any = null;
  try {
    data = JSON.parse(match[1].trim());
  } catch {
    data = null;
  }
  return { clean: text.replace(match[0], "").trim(), data };
}

function extractPayloads(text: string) {
  const a = extractBlock(text, "cardapio-json");
  const b = extractBlock(a.clean, "receita-json");
  const c = extractBlock(b.clean, "analise-json");
  return { clean: c.clean, cardapio: a.data, receita: b.data, analise: c.data };
}

function periodoKey(cardapio: any): string {
  const dias = Object.keys(cardapio?.cardapio || {});
  return dias.sort().join(",");
}


/* ------------------------- Conversational onboarding ------------------------- */

type Opt = { label: string; followUp?: string; photo?: boolean };
type Step = { q: string; options?: Opt[]; grid?: boolean; free?: boolean; skipLabel?: string };

const BRANCH_OPTIONS = [
  "📅 Montar um cardápio personalizado",
  "🍳 Dicas sobre como fazer uma receita",
  "🥦 Benefícios de algum alimento",
  "🏃 Nutrição para meu esporte",
  "📸 Analisar o que estou comendo",
  "💬 Tenho outra dúvida",
];

const o = (labels: string[]): Opt[] => labels.map((label) => ({ label }));

const FLOWS: Record<string, { steps: Step[]; finalPrompt: string }> = {
  cardapio: {
    steps: [
      { q: "Qual é o seu principal objetivo com o cardápio?", options: o(["Emagrecer", "Ganhar massa muscular", "Manter o peso", "Melhorar a saúde geral"]) },
      {
        q: "Seu peso e altura estão no perfil. Quer usar esses dados ou informar novos valores?",
        options: [{ label: "Usar dados do perfil" }, { label: "Informar novos valores", followUp: "Perfeito! Me diga seu peso e altura atuais." }],
      },
      { q: "Quantas refeições você faz por dia?", options: o(["2 refeições", "3 refeições", "4 refeições", "5 refeições", "6 refeições"]) },
      {
        q: "Você tem alguma alergia ou restrição alimentar?",
        options: [
          ...o(["Nenhuma", "Sem glúten", "Sem lactose", "Vegetariano", "Vegano"]),
          { label: "Outras", followUp: "Quais alergias ou restrições devo considerar?" },
        ],
      },
      { q: "Quais alimentos você mais gosta?", free: true },
      { q: "Quais alimentos você não gosta ou evita?", free: true },
      {
        q: "Você tem alguma deficiência nutricional conhecida?",
        options: [...o(["Não sei", "Nenhuma"]), { label: "Sim", followUp: "Qual deficiência nutricional?" }],
      },
      {
        q: "Você tem algum problema de saúde que devo considerar?",
        options: [
          ...o(["Nenhum", "Diabetes", "Hipertensão", "Colesterol alto"]),
          { label: "Outros", followUp: "Quais problemas de saúde devo considerar?" },
        ],
      },
      {
        q: "Como é sua rotina no dia a dia?",
        options: o(["Trabalho muito e tenho pouco tempo", "Tenho rotina flexível", "Pratico exercícios regularmente", "Trabalho em horários alternativos"]),
      },
      { q: "Quer adicionar mais algum detalhe sobre sua rotina?", free: true, skipLabel: "Não, seguir →" },
      { q: "Qual é seu orçamento semanal para alimentação?", options: o(["Econômico (até R$150)", "Moderado (R$150 a R$300)", "Sem limite"]) },
      { q: "Tem mais alguma informação que queira me passar antes de eu montar seu cardápio?", free: true, skipLabel: "Não, pode montar! →" },
    ],
    finalPrompt: "Monte agora um cardápio personalizado para mim com base nas informações acima e inclua o bloco técnico do cardápio.",
  },
  receita: {
    steps: [
      {
        q: "Você tem ingredientes em mãos ou quer uma sugestão?",
        options: [{ label: "Tenho ingredientes", followUp: "Quais ingredientes você tem em mãos?" }, { label: "Quero uma sugestão" }],
      },
      {
        q: "Tem alguma restrição alimentar?",
        options: [...o(["Usar as do meu perfil", "Nenhuma"]), { label: "Informar outras", followUp: "Quais restrições devo considerar?" }],
      },
      { q: "Quanto tempo tem para preparar?", options: o(["Até 15 min", "15 a 30 min", "30 a 60 min", "Sem pressa"]) },
      { q: "Quer adicionar mais alguma informação?", free: true, skipLabel: "Não, pode sugerir! →" },
    ],
    finalPrompt: "Com base nas informações acima, sugira uma receita detalhada com ingredientes e modo de preparo.",
  },
  alimento: {
    steps: [
      { q: "Qual alimento você quer conhecer melhor?", free: true },
      { q: "Por que tem interesse nesse alimento?", options: o(["Curiosidade", "Quero incluir na minha dieta", "Ouvi falar sobre ele", "Outro motivo"]) },
      { q: "Tem mais alguma coisa que queira saber?", free: true, skipLabel: "Não, pode explicar! →" },
    ],
    finalPrompt: "Com base nas informações acima, explique os benefícios e cuidados desse alimento para mim.",
  },
  esporte: {
    steps: [
      {
        q: "Qual é a sua modalidade esportiva?",
        options: [...o(["Musculação", "Corrida", "Futebol", "Ciclismo", "Natação"]), { label: "Outra", followUp: "Qual modalidade você pratica?" }],
      },
      { q: "O que você quer melhorar?", options: o(["Energia pré-treino", "Recuperação pós-treino", "Resistência", "Emagrecimento", "Ganho de massa"]) },
      { q: "Quantas vezes por semana treina?", options: o(["1 a 2x", "3 a 4x", "5 a 6x", "Todos os dias"]) },
      { q: "Quer adicionar mais alguma informação sobre seus treinos?", free: true, skipLabel: "Não, pode me ajudar! →" },
    ],
    finalPrompt: "Com base nas informações acima, me oriente sobre nutrição esportiva personalizada.",
  },
  prato: {
    steps: [
      {
        q: "Como prefere compartilhar sua refeição?",
        options: [{ label: "Enviar uma foto", photo: true }, { label: "Descrever o que comi", followUp: "Descreva o que você comeu." }],
      },
      {
        q: "Tem alguma dúvida específica sobre esse prato?",
        options: [...o(["Quantas calorias tem?", "É adequado para meu objetivo?", "Quais nutrientes tem?"]), { label: "Outra dúvida", followUp: "Qual é a sua dúvida?" }],
      },
      { q: "Quer adicionar mais alguma informação antes da análise?", free: true, skipLabel: "Não, pode analisar! →" },
    ],
    finalPrompt: "Analise minha refeição com base nas informações acima.",
  },
  outra: {
    steps: [{ q: "Claro! Me conta qual é a sua dúvida sobre alimentação e nutrição 🌿", free: true }],
    finalPrompt: "Responda à minha dúvida acima.",
  },
};

const BRANCH_KEYS = ["cardapio", "receita", "alimento", "esporte", "prato", "outra"];

const INTRO_OPTIONS = ["Sim, vamos lá! 🚀", "Me conta mais sobre você"];
const GOAL_MSG = "Ótimo! O que você veio buscar hoje? Escolha uma opção ou digite livremente 👇";

function loadHistory(): SavedConversa[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guessTitulo(messages: Msg[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.content);
  const raw = (firstUser?.content || "Conversa").replace(/^[^\p{L}\p{N}]+/u, "");
  return raw.length > 42 ? `${raw.slice(0, 42)}…` : raw;
}

export function PremiumAssistant() {
  const navigate = useNavigate();
  const { plan, isAdmin, loading } = useUserPlan();
  const isTop = isAdmin || plan === "performance";

  const [open, setOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "historico">("chat");
  const [messages, setMessages] = useState<Msg[]>(session.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [used, setUsed] = useState(0);
  const [countdown, setCountdown] = useState(nextMondayCountdown());
  const [saved, setSaved] = useState<SavedConversa[]>(() => loadHistory());
  const [viewing, setViewing] = useState<SavedConversa | null>(null);
  const [fullHistoryWarn, setFullHistoryWarn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Onboarding flow state
  const [stage, setStage] = useState<"intro" | "goal" | "branch" | "free">("intro");
  const [branch, setBranch] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const answersRef = useRef<{ q: string; a: string }[]>([]);
  const pendingImageRef = useRef<string | undefined>(undefined);

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

  useEffect(() => {
    if (open && tab === "chat" && !sending) inputRef.current?.focus();
  }, [open, tab, sending, messages.length]);

  const persistHistory = (list: SavedConversa[]) => {
    setSaved(list);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
  };

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

  const startOnboarding = useCallback(async () => {
    let nome = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle();
        nome = ((data as any)?.nome || "").split(" ")[0];
      }
    } catch { /* ignore */ }
    setStage("intro");
    setMessages([
      {
        role: "assistant",
        content: `Olá${nome ? `, ${nome}` : ""}! 👋 Sou seu Assistente Premium, especializado em alimentação e nutrição personalizada. Estou aqui para te ajudar a alcançar seus objetivos de forma prática e inteligente. Pronto para começar?`,
        options: INTRO_OPTIONS,
      },
    ]);
  }, []);

  const openPanel = async () => {
    if (!isTop) {
      setLockOpen(true);
      return;
    }
    setOpen(true);
    setTab("chat");
    loadUsage();
    if (session.welcomed) return;
    session.welcomed = true;
    await startOnboarding();
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

  const clearOptions = () =>
    setMessages((prev) => prev.map((m) => (m.options ? { ...m, options: undefined } : m)));

  const askAI = async (text: string, image?: string, baseOverride?: Msg[]) => {
    if (sending || blocked) return;
    const userMsg: Msg = { role: "user", content: text.trim(), image };
    const next = [...(baseOverride ?? messages), userMsg];
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

  const pushAssistant = (content: string, options?: string[], grid?: boolean) =>
    setMessages((prev) => [...prev, { role: "assistant", content, options, grid }]);

  const pushUser = (content: string) =>
    setMessages((prev) => [...prev.map((m) => (m.options ? { ...m, options: undefined } : m)), { role: "user", content }]);

  const askStep = (branchKey: string, idx: number) => {
    const step = FLOWS[branchKey].steps[idx];
    const opts = step.options ? step.options.map((x) => x.label) : step.skipLabel ? [step.skipLabel] : undefined;
    pushAssistant(step.q, opts);
  };

  const finishFlow = (branchKey: string) => {
    const summary = answersRef.current
      .filter((a) => a.a)
      .map((a) => `- ${a.q} ${a.a}`)
      .join("\n");
    const prompt = `${FLOWS[branchKey].finalPrompt}\n\nInformações que eu forneci:\n${summary}`;
    const image = pendingImageRef.current;
    pendingImageRef.current = undefined;
    setStage("free");
    setBranch(null);
    answersRef.current = [];
    setMessages((prev) => {
      const cleaned = prev.map((m) => (m.options ? { ...m, options: undefined } : m));
      queueMicrotask(() => askAI(prompt, image, cleaned));
      return cleaned;
    });
  };

  const advance = (branchKey: string, nextIdx: number) => {
    if (nextIdx >= FLOWS[branchKey].steps.length) {
      finishFlow(branchKey);
      return;
    }
    setStepIdx(nextIdx);
    askStep(branchKey, nextIdx);
  };

  const recordAnswer = (q: string, a: string) => {
    answersRef.current.push({ q, a });
  };

  // Handles both quick-reply clicks and free typing.
  const handleAnswer = (text: string, fromOption?: Opt) => {
    const value = text.trim();
    if (!value) return;
    pushUser(value);
    setInput("");

    if (stage === "intro") {
      if (fromOption?.label === INTRO_OPTIONS[1]) {
        pushAssistant(
          "Com prazer! Eu conheço seu perfil de saúde (objetivo, peso, altura, restrições e condições) e uso isso para te dar orientações realmente personalizadas sobre alimentação, receitas, nutrientes e rotina. Pronto para começar?",
          INTRO_OPTIONS,
        );
        return;
      }
      if (fromOption?.label === INTRO_OPTIONS[0]) {
        setStage("goal");
        pushAssistant(GOAL_MSG, BRANCH_OPTIONS, true);
        return;
      }
      // typed freely → go straight to the AI
      setStage("free");
      clearOptions();
      askAI(value);
      return;
    }

    if (stage === "goal") {
      const idx = BRANCH_OPTIONS.indexOf(fromOption?.label || "");
      if (idx === -1) {
        setStage("free");
        askAI(value);
        return;
      }
      const key = BRANCH_KEYS[idx];
      setBranch(key);
      setStage("branch");
      answersRef.current = [];
      setStepIdx(0);
      askStep(key, 0);
      return;
    }

    if (stage === "branch" && branch) {
      const step = FLOWS[branch].steps[stepIdx];
      if (followUp) {
        recordAnswer(followUp, value);
        setFollowUp(null);
        advance(branch, stepIdx + 1);
        return;
      }
      if (fromOption?.photo) {
        recordAnswer(step.q, value);
        fileRef.current?.click();
        advance(branch, stepIdx + 1);
        return;
      }
      if (fromOption?.followUp) {
        recordAnswer(step.q, value);
        setFollowUp(fromOption.followUp);
        pushAssistant(fromOption.followUp);
        return;
      }
      if (step.skipLabel && fromOption?.label === step.skipLabel) {
        advance(branch, stepIdx + 1);
        return;
      }
      recordAnswer(step.q, value);
      advance(branch, stepIdx + 1);
      return;
    }

    askAI(value);
  };

  const submitInput = () => {
    const value = input.trim();
    if (!value || sending || blocked) return;
    if (stage === "free") {
      askAI(value);
      return;
    }
    handleAnswer(value);
  };

  const onOptionClick = (label: string) => {
    if (sending) return;
    let opt: Opt | undefined = { label };
    if (stage === "branch" && branch) {
      const step = FLOWS[branch].steps[stepIdx];
      opt = step.options?.find((x) => x.label === label) || { label };
    }
    handleAnswer(label, opt);
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
    reader.onload = () => {
      const dataUrl = String(reader.result);
      if (stage === "branch" || stage === "goal" || stage === "intro") {
        pendingImageRef.current = dataUrl;
        setMessages((prev) => [...prev, { role: "user", content: "", image: dataUrl }]);
        return;
      }
      askAI("Analise este prato, por favor.", dataUrl);
    };
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

  const salvarConversa = () => {
    if (!messages.some((m) => m.role === "user")) return;
    if (saved.length >= HISTORY_LIMIT) {
      setFullHistoryWarn(true);
      setTab("historico");
      return;
    }
    const conv: SavedConversa = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      titulo: guessTitulo(messages),
      messages: messages.map((m) => ({ ...m, options: undefined })),
    };
    persistHistory([conv, ...saved]);
    toast({ title: "Conversa salva!" });
  };

  const excluirConversa = (id: number) => {
    const list = saved.filter((c) => c.id !== id);
    persistHistory(list);
    if (viewing?.id === id) setViewing(null);
    if (list.length < HISTORY_LIMIT) setFullHistoryWarn(false);
  };

  if (loading) return null;

  const counterColor = remaining <= 3 ? "#ef4444" : remaining <= 10 ? "#f59e0b" : GREEN;
  const counterWarning =
    remaining <= 0
      ? null
      : remaining <= 3
        ? `🔴 Atenção! Você tem apenas ${remaining} mensagem${remaining === 1 ? "" : "ns"} restante${remaining === 1 ? "" : "s"} esta semana.`
        : remaining <= 10
          ? "⚠️ Você está chegando ao limite semanal."
          : null;

  const renderMessages = (list: Msg[], readonly = false) => (
    <>
      {list.map((m, i) => (
        <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          {m.role === "assistant" && (
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: GREEN }}
            >
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <div className="max-w-[82%] flex flex-col items-start gap-2">
            <div
              className="px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: m.role === "user" ? GREEN : ASSISTANT_BG,
                color: m.role === "user" ? "#ffffff" : TEXT_DARK,
                borderRadius: 12,
              }}
            >
              {m.image && (
                <img src={m.image} alt="Foto do prato enviada" className="rounded-lg mb-2 max-h-40 object-cover" />
              )}
              {m.content}
              {m.cardapio && !m.saved && !readonly && (
                <button
                  onClick={() => salvarCardapio(i)}
                  className="mt-2 w-full px-3 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: GREEN, borderRadius: 8 }}
                >
                  Salvar em Meus Cardápios →
                </button>
              )}
            </div>
            {!readonly && m.options && m.options.length > 0 && (
              <div className={m.grid ? "grid grid-cols-2 gap-1.5 w-full" : "flex flex-wrap gap-1.5"}>
                {m.options.map((label) => (
                  <button
                    key={label}
                    onClick={() => onOptionClick(label)}
                    disabled={sending}
                    className="px-2.5 py-1.5 text-[12px] font-medium text-left disabled:opacity-50"
                    style={{
                      backgroundColor: GREEN_SOFT,
                      border: `1px solid ${GREEN}`,
                      color: GREEN_DARK,
                      borderRadius: 8,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );

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
          className="fixed z-50 inset-0 md:inset-auto md:bottom-5 md:right-5 md:w-[380px] md:h-[520px] flex flex-col overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 shrink-0"
            style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)` }}
          >
            <Bot className="h-5 w-5 text-white" />
            <span className="font-semibold text-white text-sm flex-1">Assistente Premium</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0 border-b" style={{ borderColor: PANEL_BORDER }}>
            {([
              { key: "chat", label: "Chat", Icon: MessageCircle },
              { key: "historico", label: `Histórico (${saved.length})`, Icon: History },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setViewing(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium"
                style={{
                  color: tab === key ? GREEN_DARK : "#64748b",
                  backgroundColor: tab === key ? GREEN_SOFT : "#ffffff",
                  borderBottom: tab === key ? `2px solid ${GREEN}` : "2px solid transparent",
                }}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div className="px-4 py-2 shrink-0" style={{ backgroundColor: GREEN_SOFT }}>
                <p className="text-xs font-medium" style={{ color: counterColor }}>
                  💬 {remaining} de {WEEKLY_LIMIT} mensagens disponíveis esta semana
                </p>
                {counterWarning && (
                  <p className="text-[11px] mt-0.5" style={{ color: counterColor }}>{counterWarning}</p>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-3 space-y-3">
                {renderMessages(messages)}

                {sending && (
                  <div className="flex gap-2 justify-start">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="px-3 py-3 flex gap-1" style={{ backgroundColor: ASSISTANT_BG, borderRadius: 12 }}>
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: GREEN, animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 p-3 border-t space-y-2" style={{ borderColor: PANEL_BORDER, backgroundColor: "#ffffff" }}>
                {messages.some((m) => m.role === "user") && (
                  <button
                    onClick={salvarConversa}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium"
                    style={{ backgroundColor: GREEN_SOFT, border: `1px solid ${GREEN}`, color: GREEN_DARK, borderRadius: 8 }}
                  >
                    <Save className="h-3.5 w-3.5" /> Salvar conversa 💾
                  </button>
                )}
                {blocked ? (
                  <div className="text-center space-y-1" style={{ color: TEXT_DARK }}>
                    <Lock className="h-5 w-5 mx-auto" />
                    <p className="text-[12px]">
                      Você atingiu seu limite de 30 mensagens esta semana. Seu Assistente Premium será
                      renovado na segunda-feira. Até lá! 🌿
                    </p>
                    <p className="text-[11px] text-muted-foreground">{countdown}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={sending}
                      aria-label="Enviar foto do prato"
                      className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                      style={{ backgroundColor: GREEN_SOFT, border: `1px solid ${GREEN}`, color: GREEN_DARK }}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitInput()}
                      placeholder="Digite sua dúvida..."
                      disabled={sending}
                      className="h-9 text-[13px]"
                      style={{ border: `1px solid ${GREEN}`, backgroundColor: "#ffffff", borderRadius: 10, color: TEXT_DARK }}
                    />
                    <button
                      onClick={submitInput}
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
            </>
          ) : (
            <div className="flex-1 overflow-auto p-3">
              {viewing ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setViewing(null)}
                    className="flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: GREEN_DARK }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <p className="text-[13px] font-semibold" style={{ color: TEXT_DARK }}>{viewing.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(viewing.created_at).toLocaleString("pt-BR")} · modo leitura
                  </p>
                  <div className="space-y-3">{renderMessages(viewing.messages, true)}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {fullHistoryWarn && (
                    <p
                      className="text-[12px] px-3 py-2"
                      style={{ backgroundColor: "#fff7ed", border: "1px solid #f59e0b", color: "#92400e", borderRadius: 8 }}
                    >
                      Você já tem 5 conversas salvas. Exclua uma para salvar esta nova.
                    </p>
                  )}
                  {saved.length === 0 ? (
                    <div className="text-center py-10" style={{ color: "#64748b" }}>
                      <History className="h-9 w-9 mx-auto mb-2 opacity-40" />
                      <p className="text-[13px]">Nenhuma conversa salva ainda.</p>
                      <p className="text-[11px] mt-1">Use "Salvar conversa 💾" no chat.</p>
                    </div>
                  ) : (
                    saved.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 px-3 py-2"
                        style={{ border: `1px solid ${PANEL_BORDER}`, borderRadius: 10, backgroundColor: ASSISTANT_BG }}
                      >
                        <button onClick={() => setViewing(c)} className="flex-1 text-left">
                          <p className="text-[13px] font-medium" style={{ color: TEXT_DARK }}>{c.titulo}</p>
                          <p className="text-[11px]" style={{ color: "#64748b" }}>
                            {new Date(c.created_at).toLocaleDateString("pt-BR")} ·{" "}
                            {new Date(c.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </button>
                        <button
                          onClick={() => excluirConversa(c.id)}
                          aria-label="Excluir conversa"
                          className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                  <p className="text-[11px] text-center pt-1" style={{ color: "#64748b" }}>
                    {saved.length}/{HISTORY_LIMIT} conversas salvas
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
