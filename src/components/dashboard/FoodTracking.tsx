import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Repeat, Lock, Camera, CalendarCheck, Loader2 } from "lucide-react";
import { useFoodTracking } from "@/hooks/useFoodTracking";
import { useGamification } from "@/hooks/useGamification";
import {
  DIAS_LABEL, MEAL_LABEL, MealLog, calcWeek, mensagemObjetivo, plannedMeals,
  summaryAvailable, todayInTz, weekDates,
} from "@/lib/food-tracking";
import { cn } from "@/lib/utils";

interface SavedMenu { id: string; created_at: string; dados: any; tipo: string }

export default function FoodTracking({ objetivo }: { objetivo?: string | null }) {
  const ft = useFoodTracking();
  const { awardXP } = useGamification();
  const [menus, setMenus] = useState<SavedMenu[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [draft, setDraft] = useState<Record<string, MealLog>>({});
  const [subFor, setSubFor] = useState<string | null>(null);
  const [subText, setSubText] = useState("");
  const [subFile, setSubFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayInTz(ft.tz);

  useEffect(() => {
    supabase.from("cardapios_salvos").select("id, created_at, dados, tipo").order("created_at", { ascending: false })
      .then(({ data }) => setMenus((data || []) as SavedMenu[]));
  }, []);

  useEffect(() => { if (!selectedDate && ft.week) setSelectedDate(today); }, [ft.week, today, selectedDate]);

  const dates = ft.week ? weekDates(ft.week.week_start) : [];
  const dayIdx = dates.indexOf(selectedDate);
  const record = ft.days.find((d) => d.day_date === selectedDate);
  useEffect(() => { setDraft(record?.meals || {}); setSubFor(null); }, [selectedDate, record]);

  const result = useMemo(() => ft.week ? calcWeek(ft.week.cardapio_snapshot, ft.week.week_start, ft.days) : null, [ft.week, ft.days]);
  const prevResult = useMemo(() => ft.prevWeek ? calcWeek(ft.prevWeek.cardapio_snapshot, ft.prevWeek.week_start, ft.prevDays) : null, [ft.prevWeek, ft.prevDays]);

  if (ft.loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!ft.week) {
    return (
      <div className="space-y-4">
        {prevResult && <WeekSummaryCard title="Resumo da semana passada" r={prevResult} objetivo={objetivo} />}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" />Escolha o cardápio desta semana</CardTitle>
            <CardDescription>O cardápio fica vinculado de segunda a domingo e não pode ser trocado até a próxima semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {menus.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não tem cardápios salvos. Crie um em Meu Cardápio.</p>}
            {menus.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="text-sm">
                  <p className="font-medium">{m.tipo === "esporte" ? "Cardápio esportivo" : "Cardápio"} de {new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                  <p className="text-muted-foreground text-xs">{Object.keys(m.dados?.cardapio || {}).length} dias</p>
                </div>
                <Button size="sm" disabled={busy} onClick={async () => {
                  setBusy(true);
                  const r = await ft.linkMenu(m.id, { cardapio: m.dados?.cardapio });
                  setBusy(false);
                  if (r.error) toast({ title: "Não foi possível vincular", description: r.error, variant: "destructive" });
                  else toast({ title: "Cardápio vinculado à semana" });
                }}>Usar nesta semana</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const planned = dayIdx >= 0 ? plannedMeals(ft.week.cardapio_snapshot, dayIdx) : [];
  const locked = !!record?.finalized || selectedDate > today;
  const doneCount = planned.filter((k) => draft[k]).length;
  const menuDay = ft.week.cardapio_snapshot.cardapio?.[["segunda","terca","quarta","quinta","sexta","sabado","domingo"][dayIdx]];

  const persist = async (meals: Record<string, MealLog>, finalize = false) => {
    setBusy(true);
    const r = await ft.saveDay(selectedDate, meals, finalize);
    setBusy(false);
    if (r.error) { toast({ title: "Erro", description: r.error, variant: "destructive" }); return false; }
    return true;
  };

  const markDone = async (k: string) => {
    const next = { ...draft, [k]: { status: "cumprida" as const } };
    if (await persist(next)) { setDraft(next); awardXP("meal_completed" as any, { acompanhamento: true }); }
  };

  const confirmSub = async () => {
    if (!subFor || (!subText.trim() && !subFile)) return;
    setBusy(true);
    const foto_path = subFile ? await ft.uploadPhoto(subFile) : undefined;
    setBusy(false);
    if (subFile && !foto_path) { toast({ title: "Falha ao enviar a foto", variant: "destructive" }); return; }
    const next = { ...draft, [subFor]: { status: "substituida" as const, descricao: subText.trim() || "Foto enviada", ...(foto_path ? { foto_path } : {}) } };
    if (await persist(next)) { setDraft(next); setSubFor(null); setSubText(""); setSubFile(null); }
  };

  const showSummary = summaryAvailable(ft.week.week_start, today, ft.days);

  return (
    <div className="space-y-4">
      {prevResult && <WeekSummaryCard title="Resumo da semana passada" r={prevResult} objetivo={objetivo} compare={null} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sua semana</CardTitle>
          <CardDescription>Toque em um dia para ver ou registrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {dates.map((d, i) => {
              const rec = ft.days.find((x) => x.day_date === d);
              const n = plannedMeals(ft.week!.cardapio_snapshot, i).length;
              const c = rec ? Object.keys(rec.meals || {}).length : 0;
              return (
                <button key={d} disabled={d > today} onClick={() => setSelectedDate(d)}
                  className={cn("rounded-lg border p-2 text-center text-xs transition-colors disabled:opacity-40",
                    d === selectedDate ? "border-primary bg-primary/10" : "border-border hover:bg-muted")}>
                  <div className="font-medium">{DIAS_LABEL[i]}</div>
                  <div className="text-muted-foreground">{c}/{n}</div>
                  {rec?.finalized && <Lock className="h-3 w-3 mx-auto mt-1 text-primary" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {dayIdx >= 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{DIAS_LABEL[dayIdx]} · {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}</CardTitle>
              {record?.finalized && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Finalizado</Badge>}
            </div>
            <Progress value={planned.length ? (doneCount / planned.length) * 100 : 0} className="h-2 mt-2" />
            <CardDescription>{doneCount} de {planned.length} refeições registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {planned.map((k) => {
              const log = draft[k];
              return (
                <div key={k} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{MEAL_LABEL[k]}</p>
                      <p className="text-sm font-medium">{menuDay?.[k]?.nome || "Refeição"}</p>
                      {log?.status === "substituida" && <p className="text-xs text-muted-foreground mt-1">Substituída: {log.descricao}</p>}
                    </div>
                    {log ? (
                      <Badge className={log.status === "cumprida" ? "" : "bg-muted text-foreground"}>
                        {log.status === "cumprida" ? <><Check className="h-3 w-3 mr-1" />Cumprida</> : <><Repeat className="h-3 w-3 mr-1" />Substituída</>}
                      </Badge>
                    ) : !locked && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" disabled={busy} onClick={() => markDone(k)}><Check className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setSubFor(k)}><Repeat className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                  {subFor === k && !locked && (
                    <div className="space-y-2">
                      <Textarea placeholder="O que você comeu no lugar?" value={subText} onChange={(e) => setSubText(e.target.value)} maxLength={300} />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Camera className="h-4 w-4" />{subFile ? subFile.name : "Adicionar foto (opcional)"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setSubFile(e.target.files?.[0] || null)} />
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || (!subText.trim() && !subFile)} onClick={confirmSub}>Confirmar substituição</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSubFor(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!locked && (
              <Button className="w-full mt-2" variant="secondary" disabled={busy} onClick={async () => {
                if (!confirm("Finalizar o dia? Depois disso não será possível alterar os registros.")) return;
                if (await persist(draft, true)) toast({ title: "Dia finalizado" });
              }}><Lock className="h-4 w-4 mr-2" />Finalizar dia</Button>
            )}
          </CardContent>
        </Card>
      )}

      {result && (showSummary
        ? <WeekSummaryCard title="Resumo desta semana" r={result} objetivo={objetivo} />
        : <Card><CardContent className="py-4 text-sm text-muted-foreground">Até agora: {result.cumpridas} refeições cumpridas, {result.substituidas} substituídas, {result.diasRegistrados} de 7 dias registrados. O resumo completo sai ao fim da semana ou ao finalizar o domingo.</CardContent></Card>)}
    </div>
  );
}

function WeekSummaryCard({ title, r, objetivo }: { title: string; r: ReturnType<typeof calcWeek>; objetivo?: string | null; compare?: null }) {
  return (
    <Card className="bg-primary text-primary-foreground">
      <CardContent className="py-5 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-2xl font-bold">{r.nota}<span className="text-sm font-normal">/100</span></span>
        </div>
        <p className="text-sm text-primary-foreground/90">{r.cumpridas} de {r.planejadas} refeições do cardápio cumpridas · {r.substituidas} substituídas · {r.diasRegistrados}/7 dias registrados</p>
        <p className="text-sm text-primary-foreground/90">{mensagemObjetivo(objetivo, r.nota)}</p>
      </CardContent>
    </Card>
  );
}
