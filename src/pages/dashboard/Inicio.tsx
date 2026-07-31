import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, ChefHat, Camera, Dumbbell, MessageCircle, FileText,
  UtensilsCrossed, ArrowRight, CalendarRange, Flame,
} from "lucide-react";
import { useWeeklySummary, formatWeekRange, type WeekMetrics } from "@/hooks/useWeeklySummary";

const shortcuts = [
  { title: "Meu Cardápio", icon: CalendarDays, url: "/dashboard/cardapio" },
  { title: "Receitas", icon: ChefHat, url: "/dashboard/receitas" },
  { title: "Analisar Prato", icon: Camera, url: "/dashboard/analisador-prato" },
  { title: "Modo Esporte", icon: Dumbbell, url: "/dashboard/modo-esporte" },
  { title: "Conversa Saudável", icon: MessageCircle, url: "/dashboard/chat" },
];

const metricDefs: { key: keyof WeekMetrics; label: string; icon: any }[] = [
  { key: "cardapios", label: "Cardápios Criados", icon: CalendarDays },
  { key: "refeicoes", label: "Refeições Concluídas", icon: UtensilsCrossed },
  { key: "analises", label: "Pratos Analisados", icon: Camera },
  { key: "receitas", label: "Receitas Criadas", icon: ChefHat },
  { key: "esportivos", label: "Cardápios Esportivos", icon: Dumbbell },
  { key: "pdfs", label: "PDFs Baixados", icon: FileText },
];

const DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];

function greeting(nome: string) {
  const h = new Date().getHours();
  const alvo = nome ? `, ${nome}` : "";
  if (h < 12) return `Bom dia${alvo}! ☀️`;
  if (h < 18) return `Boa tarde${alvo}! 🌤️`;
  return `Boa noite${alvo}! 🌙`;
}

function Comparativo({ atual, anterior }: { atual: number; anterior: number }) {
  const diff = atual - (anterior || 0);
  if (diff > 0) return <span className="text-xs text-primary">▲ {diff} a mais que semana passada</span>;
  if (diff < 0) return <span className="text-xs text-destructive/80">▼ {Math.abs(diff)} a menos que semana passada</span>;
  return <span className="text-xs text-muted-foreground">= Igual à semana passada</span>;
}

function consistencyMessage(days: number) {
  if (days >= 7) return "Semana perfeita! Continue assim! 🏆";
  if (days >= 5) return "Ótima semana! Quase lá! 💪";
  if (days >= 3) return "Boa semana! Tente manter mais dias ativos 🌿";
  if (days >= 1) return "Semana fraca. Que tal criar um cardápio hoje? 🎯";
  return "Você ainda não usou a plataforma esta semana. Vamos começar? 🌱";
}

export default function Inicio() {
  const navigate = useNavigate();
  const { current, previous, loading, nome } = useWeeklySummary(8);

  const metrics = current?.metrics;
  const activeDays = current?.activeDays ?? [];
  const activeCount = activeDays.filter(Boolean).length;

  const cta = useMemo(() => {
    if (!metrics) return { label: "Criar meu Cardápio da Semana →", url: "/dashboard/cardapio" };
    if (metrics.cardapios === 0) return { label: "Criar meu Cardápio da Semana →", url: "/dashboard/cardapio" };
    if (metrics.analises === 0) return { label: "Experimentar o Analisador de Pratos →", url: "/dashboard/analisador-prato" };
    if (activeCount >= 5) return { label: "Ver meu Progresso →", url: "/dashboard/progresso" };
    return { label: "Ver minhas Receitas →", url: "/dashboard/receitas" };
  }, [metrics, activeCount]);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{greeting(nome)}</h1>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {shortcuts.map((s) => (
          <button
            key={s.title}
            onClick={() => navigate(s.url)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/60 hover:bg-muted border border-border p-3 transition-colors"
          >
            <s.icon className="h-6 w-6 text-primary" />
            <span className="text-[11px] leading-tight text-center text-muted-foreground">{s.title}</span>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <CalendarRange className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Seu Resumo desta Semana 📊</h2>
              <p className="text-sm text-muted-foreground">
                {current ? formatWeekRange(current.start) : "Carregando..."}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard/historico-semanal")}
            className="text-sm text-primary hover:underline"
          >
            Ver Histórico →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metricDefs.map((m) => (
            <div key={m.key} className="rounded-xl bg-muted/50 border border-border p-3">
              <m.icon className="h-4 w-4 text-primary mb-1.5" />
              <div className="text-2xl font-bold text-primary">
                {loading ? "—" : metrics?.[m.key] ?? 0}
              </div>
              <div className="text-sm text-foreground">{m.label}</div>
              {!loading && (
                <Comparativo atual={metrics?.[m.key] ?? 0} anterior={previous?.metrics[m.key] ?? 0} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-primary" /> Sua consistência esta semana 🔥
          </h3>
          <div className="flex items-center gap-3">
            {DIAS.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full border ${
                    activeDays[i] ? "bg-primary border-primary" : "bg-muted border-border"
                  }`}
                />
                <span className="text-[10px] text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{consistencyMessage(activeCount)}</p>
        </div>

        <button
          onClick={() => navigate(cta.url)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {cta.label.replace(" →", "")} <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}
