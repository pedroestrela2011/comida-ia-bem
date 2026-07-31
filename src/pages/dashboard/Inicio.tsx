import { useNavigate } from "react-router-dom";
import { CalendarDays, ChefHat, Camera, Dumbbell, MessageCircle } from "lucide-react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useWeeklyNarrative } from "@/hooks/useWeeklyNarrative";

const shortcuts = [
  { title: "Meu Cardápio", icon: CalendarDays, url: "/dashboard/cardapio" },
  { title: "Receitas", icon: ChefHat, url: "/dashboard/receitas" },
  { title: "Analisar Prato", icon: Camera, url: "/dashboard/analisador-prato" },
  { title: "Modo Esporte", icon: Dumbbell, url: "/dashboard/modo-esporte" },
  { title: "Conversa Saudável", icon: MessageCircle, url: "/dashboard/chat" },
];

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function periodoCurto(start?: Date) {
  if (!start) return "";
  const last = new Date(start);
  last.setDate(last.getDate() + 6);
  if (start.getMonth() === last.getMonth()) {
    return `${start.getDate()} a ${last.getDate()} de ${MESES[last.getMonth()]}`;
  }
  return `${start.getDate()} de ${MESES[start.getMonth()]} a ${last.getDate()} de ${MESES[last.getMonth()]}`;
}

function greeting(nome: string) {
  const h = new Date().getHours();
  const alvo = nome ? `, ${nome}` : "";
  if (h < 12) return `Bom dia${alvo}! ☀️`;
  if (h < 18) return `Boa tarde${alvo}! 🌤️`;
  return `Boa noite${alvo}! 🌙`;
}

export default function Inicio() {
  const navigate = useNavigate();
  const { current, previous, nome } = useWeeklySummary(8);
  const { texto, loading } = useWeeklyNarrative(current, previous);

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

      <section className="rounded-2xl bg-primary text-primary-foreground p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Seu Resumo da Semana 🌿</h2>
          <span className="text-xs text-primary-foreground/70 shrink-0">{periodoCurto(current?.start)}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90">
          {loading ? "Preparando seu resumo..." : texto}
        </p>
      </section>
    </div>
  );
}

