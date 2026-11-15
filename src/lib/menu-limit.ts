export const MENU_MONTHLY_LIMIT = 4;

/** Início do mês corrente no fuso de São Paulo (UTC-3), em ISO. */
export function monthStartSaoPaulo(now: Date = new Date()): string {
  const sp = new Date(now.getTime() - 3 * 3600_000);
  return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), 1, 3)).toISOString();
}

export function remainingCreations(used: number, limit = MENU_MONTHLY_LIMIT): number {
  return Math.max(0, limit - used);
}

/** Nomes de todas as refeições do cardápio, para pedir à IA que não repita. */
export function mealNames(cardapio: Record<string, unknown> | undefined): string[] {
  const out: string[] = [];
  for (const dia of Object.values(cardapio || {})) {
    for (const ref of Object.values((dia as Record<string, any>) || {})) {
      if (ref && typeof ref === "object" && typeof (ref as any).nome === "string") out.push((ref as any).nome);
    }
  }
  return out;
}
