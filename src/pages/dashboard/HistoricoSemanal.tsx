import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Camera, FileText } from "lucide-react";
import { useWeeklySummary, formatWeekRange } from "@/hooks/useWeeklySummary";

export default function HistoricoSemanal() {
  const navigate = useNavigate();
  const { summaries, loading } = useWeeklySummary(8);

  const ordered = [...summaries].reverse();

  return (
    <div className="space-y-5 max-w-4xl">
      <button
        onClick={() => navigate("/dashboard/inicio")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao Início
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico das últimas 8 semanas 📊</h1>
        <p className="text-sm text-muted-foreground">Suas principais métricas semana a semana.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ordered.map((w, i) => (
            <div key={w.start.toISOString()} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{formatWeekRange(w.start)}</span>
                {i === 0 && (
                  <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">Semana atual</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/50 p-2">
                  <CalendarDays className="h-4 w-4 text-primary mb-1" />
                  <div className="text-lg font-bold text-primary">{w.metrics.cardapios}</div>
                  <div className="text-[11px] text-muted-foreground">Cardápios</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <Camera className="h-4 w-4 text-primary mb-1" />
                  <div className="text-lg font-bold text-primary">{w.metrics.analises}</div>
                  <div className="text-[11px] text-muted-foreground">Pratos</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <FileText className="h-4 w-4 text-primary mb-1" />
                  <div className="text-lg font-bold text-primary">{w.metrics.pdfs}</div>
                  <div className="text-[11px] text-muted-foreground">PDFs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
