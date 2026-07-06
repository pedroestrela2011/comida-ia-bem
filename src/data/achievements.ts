import type { Rarity } from "@/lib/rarity";

export type AchievementCategory =
  | "alimentacao"
  | "receitas"
  | "analisador"
  | "esporte"
  | "progresso"
  | "pdf"
  | "streak"
  | "surpresa";

export type AchievementContext = {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  mealsCompleted: number;
  perfectDays: number; // dias com todas refeições marcadas
  perfectDaysStreak: number;
  cardapios: number;
  analises: number;
  receitas: number;
  esporte: number;
  progressos: number;
  pdfs: number;
  featuresUsed: Set<string>;
  weekendStreakWeeks: number;
  earlyMorningCardapio: boolean;
  everLostStreak: boolean;
  reachedMaxLevel: boolean;
};

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: Rarity;
  secret?: boolean;
  condition: (c: AchievementContext) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Alimentação
  { key: "meal_1", title: "O Primeiro Passo", description: "Primeira refeição concluída", icon: "🍽️", category: "alimentacao", rarity: "comum", condition: (c) => c.mealsCompleted >= 1 },
  { key: "meal_10", title: "Dez e Contando", description: "10 refeições concluídas", icon: "🥗", category: "alimentacao", rarity: "comum", condition: (c) => c.mealsCompleted >= 10 },
  { key: "meal_50", title: "Meio Século Saudável", description: "50 refeições concluídas", icon: "🥇", category: "alimentacao", rarity: "rara", condition: (c) => c.mealsCompleted >= 50 },
  { key: "perfect_week", title: "Semana Blindada", description: "7 dias com todas refeições marcadas", icon: "🛡️", category: "alimentacao", rarity: "rara", condition: (c) => c.perfectDaysStreak >= 7 },
  { key: "perfect_30", title: "Arquiteto do Prato", description: "30 dias completos", icon: "🏛️", category: "alimentacao", rarity: "epica", condition: (c) => c.perfectDays >= 30 },
  { key: "perfect_90", title: "Lenda da Mesa", description: "3 meses completos", icon: "👑", category: "alimentacao", rarity: "lendaria", condition: (c) => c.perfectDays >= 90 },

  // Receitas
  { key: "rec_1", title: "Fogão Ligado", description: "Primeira receita criada", icon: "🍳", category: "receitas", rarity: "comum", condition: (c) => c.receitas >= 1 },
  { key: "rec_5", title: "Tempero Próprio", description: "5 receitas criadas", icon: "🧂", category: "receitas", rarity: "comum", condition: (c) => c.receitas >= 5 },
  { key: "rec_20", title: "Cozinha em Chamas", description: "20 receitas criadas", icon: "🔥", category: "receitas", rarity: "rara", condition: (c) => c.receitas >= 20 },
  { key: "rec_50", title: "O Alquimista da Cozinha", description: "50 receitas criadas", icon: "⚗️", category: "receitas", rarity: "epica", condition: (c) => c.receitas >= 50 },

  // Analisador
  { key: "ana_1", title: "Olho Clínico", description: "Primeiro prato analisado", icon: "🔍", category: "analisador", rarity: "comum", condition: (c) => c.analises >= 1 },
  { key: "ana_5", title: "Detetive do Prato", description: "5 pratos analisados", icon: "🕵️", category: "analisador", rarity: "comum", condition: (c) => c.analises >= 5 },
  { key: "ana_20", title: "Scanner Nutricional", description: "20 pratos analisados", icon: "📡", category: "analisador", rarity: "rara", condition: (c) => c.analises >= 20 },
  { key: "ana_50", title: "Visão de Raio-X", description: "50 pratos analisados", icon: "🩻", category: "analisador", rarity: "epica", condition: (c) => c.analises >= 50 },

  // Esporte
  { key: "esp_1", title: "Aquecimento Inicial", description: "Primeiro cardápio esportivo", icon: "🏃", category: "esporte", rarity: "comum", condition: (c) => c.esporte >= 1 },
  { key: "esp_5", title: "Combustível de Elite", description: "5 cardápios esportivos gerados", icon: "⚡", category: "esporte", rarity: "rara", condition: (c) => c.esporte >= 5 },
  { key: "esp_15", title: "Máquina em Operação", description: "15 cardápios esportivos", icon: "🤖", category: "esporte", rarity: "epica", condition: (c) => c.esporte >= 15 },
  { key: "esp_30", title: "Protocolo Olímpico", description: "30 cardápios esportivos", icon: "🏅", category: "esporte", rarity: "lendaria", condition: (c) => c.esporte >= 30 },

  // Progresso
  { key: "prog_1", title: "Espelho da Mudança", description: "Primeira atualização de progresso", icon: "🪞", category: "progresso", rarity: "comum", condition: (c) => c.progressos >= 1 },
  { key: "prog_30", title: "Gráfico Ascendente", description: "30 dias de atualizações", icon: "📈", category: "progresso", rarity: "rara", condition: (c) => c.progressos >= 30 },
  { key: "prog_90", title: "Dados que Não Mentem", description: "3 meses de atualizações", icon: "📊", category: "progresso", rarity: "epica", condition: (c) => c.progressos >= 90 },
  { key: "prog_180", title: "Obra de uma Vida", description: "6 meses de atualizações", icon: "🏆", category: "progresso", rarity: "lendaria", condition: (c) => c.progressos >= 180 },

  // PDF
  { key: "pdf_1", title: "Impresso e Planejado", description: "Primeiro PDF baixado", icon: "📄", category: "pdf", rarity: "comum", condition: (c) => c.pdfs >= 1 },
  { key: "pdf_5", title: "Pasta da Saúde", description: "5 PDFs baixados", icon: "📁", category: "pdf", rarity: "rara", condition: (c) => c.pdfs >= 5 },
  { key: "pdf_20", title: "Biblioteca Nutricional", description: "20 PDFs baixados", icon: "📚", category: "pdf", rarity: "epica", condition: (c) => c.pdfs >= 20 },

  // Streak
  { key: "streak_3", title: "Faísca Inicial", description: "3 dias consecutivos", icon: "🔥", category: "streak", rarity: "comum", condition: (c) => c.longestStreak >= 3 },
  { key: "streak_7", title: "Chama Acesa", description: "7 dias consecutivos", icon: "🔥", category: "streak", rarity: "rara", condition: (c) => c.longestStreak >= 7 },
  { key: "streak_15", title: "Fogo que não Apaga", description: "15 dias consecutivos", icon: "🔥", category: "streak", rarity: "rara", condition: (c) => c.longestStreak >= 15 },
  { key: "streak_30", title: "Vulcão de Hábitos", description: "30 dias consecutivos", icon: "🌋", category: "streak", rarity: "epica", condition: (c) => c.longestStreak >= 30 },
  { key: "streak_100", title: "Imortal da Constância", description: "100 dias consecutivos", icon: "⚡", category: "streak", rarity: "lendaria", condition: (c) => c.longestStreak >= 100 },

  // Surpresa (secret)
  { key: "sec_ave_noturna", title: "Ave Noturna Arrependida", description: "Gerou um cardápio antes das 7h da manhã", icon: "🦉", category: "surpresa", rarity: "rara", secret: true, condition: (c) => c.earlyMorningCardapio },
  { key: "sec_heroi_fds", title: "Herói do Fim de Semana", description: "Manteve sequência no sábado e domingo por 4 semanas seguidas", icon: "🦸", category: "surpresa", rarity: "rara", secret: true, condition: (c) => c.weekendStreakWeeks >= 4 },
  { key: "sec_curioso", title: "Curioso Insaciável", description: "Usou todas as funcionalidades da plataforma pelo menos uma vez", icon: "🧭", category: "surpresa", rarity: "epica", secret: true, condition: (c) => ["cardapio","receita","analisador","esporte","progresso","pdf"].every(f => c.featuresUsed.has(f)) },
  { key: "sec_sem_erro", title: "Sem Margem para Erro", description: "Completou todas as refeições de um dia por 7 dias seguidos", icon: "🎯", category: "surpresa", rarity: "epica", secret: true, condition: (c) => c.perfectDaysStreak >= 7 },
  { key: "sec_silencioso", title: "O Silencioso Invicto", description: "Acumulou 5000 XP sem nunca perder uma sequência", icon: "🥷", category: "surpresa", rarity: "lendaria", secret: true, condition: (c) => c.totalXP >= 5000 && !c.everLostStreak },
  { key: "sec_alem", title: "Além do Limite", description: "Atingiu o nível máximo Guardião do Equilíbrio", icon: "🌌", category: "surpresa", rarity: "lendaria", secret: true, condition: (c) => c.totalXP >= 10000 },
];

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  alimentacao: "Alimentação",
  receitas: "Receitas",
  analisador: "Analisador",
  esporte: "Esporte",
  progresso: "Progresso",
  pdf: "PDFs",
  streak: "Sequência",
  surpresa: "Surpresa",
};
