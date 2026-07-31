import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type WeekSummary, formatWeekRange } from "@/hooks/useWeeklySummary";

const FALLBACK =
  "Ainda estamos te conhecendo! Use a plataforma durante a semana e na segunda-feira você verá seu primeiro resumo aqui. 🌿";

function cacheKey(userId: string, weekStart: Date) {
  const k = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
  return `comafacil:resumo-semana:${userId}:${k}`;
}

/**
 * Weekly AI narrative about the PREVIOUS week.
 * Generated once per week (Monday 00:00 local time) and cached for the whole week.
 */
export function useWeeklyNarrative(current?: WeekSummary, previous?: WeekSummary) {
  const [texto, setTexto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (!current || started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setTexto(FALLBACK); setLoading(false); }
        return;
      }

      const key = cacheKey(user.id, current.start);
      const cached = localStorage.getItem(key);
      if (cached) {
        if (!cancelled) { setTexto(cached); setLoading(false); }
        return;
      }

      const m = previous?.metrics;
      const diasAtivos = previous?.activeDays.filter(Boolean).length ?? 0;
      const total = m
        ? m.cardapios + m.refeicoes + m.analises + m.receitas + m.esportivos + m.pdfs
        : 0;

      if (!m || total === 0) {
        if (!cancelled) { setTexto(FALLBACK); setLoading(false); }
        return;
      }

      const esperadas = Math.max(m.refeicoes, m.cardapios * 21);
      try {
        const { data, error } = await supabase.functions.invoke("resumo-semanal", {
          body: {
            cardapios: m.cardapios,
            refeicoesConcluidas: m.refeicoes,
            refeicoesNaoConcluidas: Math.max(0, esperadas - m.refeicoes),
            diasAtivos,
            periodo: previous ? formatWeekRange(previous.start) : "",
          },
        });
        if (error || !data?.resumo) throw error || new Error("sem resumo");
        localStorage.setItem(key, data.resumo);
        if (!cancelled) setTexto(data.resumo);
      } catch {
        if (!cancelled) setTexto(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [current, previous]);

  return { texto, loading };
}
