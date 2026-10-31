export const DIAS_KEYS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] as const;
export const DIAS_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const MEAL_ORDER = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"];
export const MEAL_LABEL: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_manha: "Lanche da Manhã",
  almoco: "Almoço", lanche_tarde: "Lanche da Tarde", jantar: "Jantar",
};

export type MealLog = { status: "cumprida" | "substituida"; descricao?: string; foto_path?: string };
export type DayRecord = { day_date: string; meals: Record<string, MealLog>; finalized: boolean };
export type MenuSnapshot = { cardapio?: Record<string, Record<string, { nome?: string; descricao?: string } | undefined>> };

export function todayInTz(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function hourInTz(tz: string, now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(now)) % 24;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday (ISO) of the week containing `iso`. */
export function weekStartOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const diff = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -diff);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function plannedMeals(snapshot: MenuSnapshot, dayIndex: number): string[] {
  const dia = snapshot?.cardapio?.[DIAS_KEYS[dayIndex]];
  if (!dia) return [];
  return MEAL_ORDER.filter((k) => !!dia[k]);
}

export interface WeekResult {
  planejadas: number;
  cumpridas: number;
  substituidas: number;
  diasRegistrados: number;
  nota: number; // 0-100
}

/** Nota objetiva: 60% refeições do cardápio cumpridas + 40% dias registrados. Sem bônus pelo objetivo. */
export function calcWeek(snapshot: MenuSnapshot, weekStart: string, days: DayRecord[]): WeekResult {
  const dates = weekDates(weekStart);
  let planejadas = 0, cumpridas = 0, substituidas = 0, diasRegistrados = 0;
  dates.forEach((date, i) => {
    const planned = plannedMeals(snapshot, i);
    planejadas += planned.length;
    const rec = days.find((d) => d.day_date === date);
    if (!rec) return;
    const logs = planned.map((k) => rec.meals?.[k]).filter(Boolean) as MealLog[];
    if (logs.length > 0) diasRegistrados += 1;
    cumpridas += logs.filter((l) => l.status === "cumprida").length;
    substituidas += logs.filter((l) => l.status === "substituida").length;
  });
  const a = planejadas > 0 ? cumpridas / planejadas : 0;
  const b = diasRegistrados / 7;
  return { planejadas, cumpridas, substituidas, diasRegistrados, nota: Math.round(60 * a + 40 * b) };
}

/** Resumo liberado após o fim da semana ou com o domingo finalizado. */
export function summaryAvailable(weekStart: string, today: string, days: DayRecord[]): boolean {
  const sunday = addDays(weekStart, 6);
  if (today > sunday) return true;
  return !!days.find((d) => d.day_date === sunday && d.finalized);
}

export function mensagemObjetivo(objetivo: string | null | undefined, nota: number): string {
  const nivel = nota >= 80 ? "Excelente semana" : nota >= 50 ? "Boa semana" : "Semana de recomeço";
  const o = (objetivo || "").toLowerCase();
  const foco = o.includes("emagre") ? "Manter essa constância ajuda no seu objetivo de emagrecer."
    : o.includes("massa") ? "Seguir as refeições planejadas é a base para ganhar massa."
    : o.includes("perform") ? "Regularidade alimentar sustenta sua performance esportiva."
    : "Cada refeição registrada aproxima você de hábitos mais saudáveis.";
  return `${nivel}. ${foco}`;
}
