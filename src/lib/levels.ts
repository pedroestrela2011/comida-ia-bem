export type Level = {
  min: number;
  max: number;
  name: string;
  icon: string;
};

export const LEVELS: Level[] = [
  { min: 0, max: 500, name: "Semente Verde", icon: "🌱" },
  { min: 500, max: 2000, name: "Broto Consciente", icon: "🌿" },
  { min: 2000, max: 5000, name: "Raiz Forte", icon: "🌳" },
  { min: 5000, max: 10000, name: "Colheita Dourada", icon: "🌾" },
  { min: 10000, max: Infinity, name: "Guardião do Equilíbrio", icon: "⚡" },
];

export function getLevel(xp: number): Level {
  return LEVELS.find((l) => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1];
}

export function getLevelIndex(xp: number): number {
  return LEVELS.findIndex((l) => xp >= l.min && xp < l.max);
}

export function getProgress(xp: number): { pct: number; toNext: number; nextName: string | null } {
  const idx = getLevelIndex(xp);
  const lvl = LEVELS[idx];
  if (lvl.max === Infinity) return { pct: 100, toNext: 0, nextName: null };
  const range = lvl.max - lvl.min;
  const inLevel = xp - lvl.min;
  return {
    pct: Math.min(100, Math.round((inLevel / range) * 100)),
    toNext: lvl.max - xp,
    nextName: LEVELS[idx + 1]?.name ?? null,
  };
}

export const XP_VALUES = {
  meal_completed: 10,
  cardapio: 20,
  analisador: 15,
  receita: 15,
  esporte: 25,
  progresso: 20,
  pdf: 10,
  streak_7_bonus: 100,
  streak_30_bonus: 500,
} as const;

export type XPAction = keyof typeof XP_VALUES;
