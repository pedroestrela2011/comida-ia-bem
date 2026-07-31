import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeekMetrics {
  cardapios: number;
  refeicoes: number;
  analises: number;
  receitas: number;
  esportivos: number;
  pdfs: number;
}

export interface WeekSummary {
  start: Date;
  end: Date;
  metrics: WeekMetrics;
  /** 7 booleans, Monday..Sunday — whether the user did anything that day */
  activeDays: boolean[];
}

const emptyMetrics = (): WeekMetrics => ({
  cardapios: 0,
  refeicoes: 0,
  analises: 0,
  receitas: 0,
  esportivos: 0,
  pdfs: 0,
});

/** Monday 00:00 local time of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - diff);
  return date;
}

export function endOfWeek(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function formatWeekRange(start: Date): string {
  const last = new Date(start);
  last.setDate(last.getDate() + 6);
  if (start.getMonth() === last.getMonth()) {
    return `${start.getDate()} a ${last.getDate()} de ${MESES[last.getMonth()]} de ${last.getFullYear()}`;
  }
  return `${start.getDate()} de ${MESES[start.getMonth()]} a ${last.getDate()} de ${MESES[last.getMonth()]} de ${last.getFullYear()}`;
}

interface Row {
  created_at: string;
  kind: keyof WeekMetrics;
}

function bucketIndex(iso: string, firstWeekStart: Date): number {
  const d = new Date(iso);
  const ws = startOfWeek(d).getTime();
  return Math.round((ws - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function useWeeklySummary(weeks = 8) {
  const [summaries, setSummaries] = useState<WeekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const currentStart = startOfWeek(new Date());
      const firstStart = new Date(currentStart);
      firstStart.setDate(firstStart.getDate() - 7 * (weeks - 1));
      const sinceIso = firstStart.toISOString();
      const sinceDate = firstStart.toISOString().split("T")[0];

      const [profileRes, menusRes, actionsRes, xpRes, pdfRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("cardapios_salvos").select("created_at, tipo").eq("user_id", user.id).gte("created_at", sinceIso),
        supabase.from("daily_actions").select("action_date, action_type").eq("user_id", user.id).gte("action_date", sinceDate),
        supabase.from("xp_events").select("created_at, action_type").eq("user_id", user.id).gte("created_at", sinceIso),
        supabase.from("pdf_downloads").select("created_at").eq("user_id", user.id).gte("created_at", sinceIso),
      ]);

      const rows: Row[] = [];

      (menusRes.data || []).forEach((m: any) => {
        rows.push({ created_at: m.created_at, kind: m.tipo === "esporte" ? "esportivos" : "cardapios" });
      });
      (actionsRes.data || []).forEach((a: any) => {
        const iso = `${a.action_date}T12:00:00`;
        if (a.action_type === "analisador") rows.push({ created_at: iso, kind: "analises" });
        else if (a.action_type === "refeicao") rows.push({ created_at: iso, kind: "refeicoes" });
      });
      (xpRes.data || []).forEach((e: any) => {
        if (e.action_type === "receita") rows.push({ created_at: e.created_at, kind: "receitas" });
        else if (e.action_type === "refeicao") rows.push({ created_at: e.created_at, kind: "refeicoes" });
      });
      (pdfRes.data || []).forEach((p: any) => {
        rows.push({ created_at: p.created_at, kind: "pdfs" });
      });

      const result: WeekSummary[] = Array.from({ length: weeks }, (_, i) => {
        const start = new Date(firstStart);
        start.setDate(start.getDate() + 7 * i);
        return {
          start,
          end: endOfWeek(start),
          metrics: emptyMetrics(),
          activeDays: [false, false, false, false, false, false, false],
        };
      });

      rows.forEach((r) => {
        const idx = bucketIndex(r.created_at, firstStart);
        if (idx < 0 || idx >= weeks) return;
        result[idx].metrics[r.kind] += 1;
        const day = (new Date(r.created_at).getDay() + 6) % 7;
        result[idx].activeDays[day] = true;
      });

      if (!cancelled) {
        setSummaries(result);
        setNome(((profileRes.data as any)?.nome || "").split(" ")[0] || "");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [weeks]);

  const current = summaries[summaries.length - 1];
  const previous = summaries[summaries.length - 2];

  return { summaries, current, previous, loading, nome };
}
