# Sistema de Jornada de Evolução

Sistema completo, opcional (opt-in), de gamificação com XP, níveis, sequências, conquistas com raridades e notificações. Substitui a lógica atual de `useAchievements` por uma versão expandida.

## 1. Banco de dados (migração única)

Nova coluna e tabelas para suportar XP, protetor de sequência e config de opt-in.

- `profiles.gamificacao_ativa boolean default false` — flag de opt-in.
- `profiles.gamificacao_onboarded boolean default false` — controla exibição do modal de boas-vindas.
- Nova tabela `user_xp`:
  - `user_id uuid PK` (FK auth.users)
  - `total_xp int default 0`
  - `current_streak int default 0`
  - `longest_streak int default 0`
  - `last_action_date date`
  - `streak_shield_available boolean default true`
  - `shield_month text` (YYYY-MM — para reset mensal)
  - `updated_at`
- Nova tabela `xp_events` (log auditável, opcional mas útil p/ conquistas surpresa):
  - `id`, `user_id`, `action_type`, `xp_amount int`, `metadata jsonb`, `created_at`
- Expandir `user_achievements` (já existe) — nenhuma mudança de schema, apenas novas chaves.
- GRANTs para `authenticated` + `service_role`; RLS por `auth.uid()`.

## 2. Hook central `useGamification`

Substitui/estende `useAchievements`. Responsabilidades:

- Ler `profiles.gamificacao_ativa`. Se falso → retorna `enabled: false` e não registra nada.
- `awardXP(actionType, metadata?)`:
  - Insere em `xp_events`, incrementa `user_xp.total_xp`.
  - Atualiza streak (compara `last_action_date` com hoje; +1 se ontem, mantém se hoje, senão tenta usar shield ou zera).
  - Adiciona bônus de streak (100 XP em 7 dias, 500 XP em 30 dias) via marcador de bônus concedido em `xp_events.metadata`.
  - Chama `checkAchievements` no fim.
- `useStreakShield()` — consome shield se disponível, reseta mensalmente.
- `checkAchievements(ctx)` — percorre catálogo, insere novos em `user_achievements`, dispara toast via sonner.

## 3. Catálogo de conquistas

Arquivo `src/data/achievements.ts` com todas as ~40 conquistas (alimentação, receitas, analisador, esporte, progresso, PDF, sequência, surpresa). Cada uma:
```ts
{ key, title, description, icon, category, rarity: 'comum'|'rara'|'epica'|'lendaria', secret?: boolean, condition: (ctx) => boolean }
```

Ctx expandido com: `totalXP`, `streak`, `longestStreak`, `mealsCompleted`, `cardapios`, `analises`, `receitas`, `esporte`, `progressos`, `pdfs`, `featuresUsed: Set<string>`, `weekendStreakWeeks`, `earlyMorningCardapio`, `perfectDaysStreak`, `everLostStreak`.

## 4. Integração nas ações existentes

Adicionar chamadas `awardXP(...)` nos pontos:
- `Cardapio.tsx` — geração de cardápio (+20), marcar refeição (+10), download PDF (+10).
- `Receitas.tsx` — nova receita (+15), PDF (+10).
- `AnalisadorPrato.tsx` — análise (+15).
- `ModoEsporte.tsx` — geração (+25).
- `Progresso.tsx` — nova entrada (+20).

Todas checam `enabled` antes de fazer qualquer coisa.

## 5. Sistema de níveis

Utilitário `src/lib/levels.ts`:
```ts
LEVELS = [
  { min: 0, max: 500, name: 'Semente Verde', icon: '🌱' },
  { min: 500, max: 2000, name: 'Broto Consciente', icon: '🌿' },
  ...
]
getLevel(xp), getProgress(xp) // % até próximo nível
```

## 6. Raridades

`src/lib/rarity.ts` — mapa raridade → classes Tailwind (cinza simples, azul brilho, roxo pulsante, dourado com animação girando via keyframes). Adicionar keyframe `legendary-shine` ao `tailwind.config.ts`.

## 7. UI

- **`Configuracoes.tsx`** — nova seção "Jornada de Evolução" com Switch. Ao ativar pela primeira vez, abre `WelcomeGamificationDialog`.
- **Sidebar** — item "Jornada" visível apenas quando `gamificacao_ativa`.
- **Nova página `/dashboard/jornada`** (`Jornada.tsx`):
  - Card de nível: ícone grande, título, XP atual, barra de progresso até próximo nível.
  - Card de sequência: chama 🔥 + número, escudo dourado se shield disponível.
  - Grid de conquistas por categoria com raridade visual; secretas aparecem "???".
  - Percentual de conclusão total.
  - Estatísticas pessoais (contadores).
- **Toast de desbloqueio** — via `sonner`, cor conforme raridade, ícone + "Nova conquista desbloqueada!", 4s.

Ocultar a rota antiga de Conquistas (ou redirecionar para `/jornada`) quando gamificação ativa; caso contrário oculta do menu.

## 8. Arquivos

**Novos:**
- `supabase/migrations/<ts>_gamification.sql`
- `src/data/achievements.ts`
- `src/lib/levels.ts`
- `src/lib/rarity.ts`
- `src/hooks/useGamification.ts`
- `src/components/dashboard/WelcomeGamificationDialog.tsx`
- `src/components/dashboard/RarityBadge.tsx`
- `src/pages/dashboard/Jornada.tsx`

**Editados:**
- `src/App.tsx` (rota /jornada)
- `src/components/AppSidebar.tsx` (item condicional)
- `src/pages/dashboard/Configuracoes.tsx` (toggle + modal)
- `src/pages/dashboard/Cardapio.tsx`, `Receitas.tsx`, `AnalisadorPrato.tsx`, `ModoEsporte.tsx`, `Progresso.tsx` (chamadas `awardXP`)
- `tailwind.config.ts` (keyframes lendário)
- Remove/oculta conquistas antigas em `Conquistas.tsx` (mantém arquivo para não quebrar, mas página não é linkada)

## Detalhes técnicos

- Toda escrita passa por RLS `auth.uid() = user_id`.
- `checkAchievements` roda sempre após qualquer `awardXP` — leituras agregadas via `count` em `xp_events` filtradas por `action_type`.
- Streak calculada em fuso do cliente (date-only) para simplicidade; shield reseta comparando `shield_month` com mês atual.
- Toasts usam `sonner` (já disponível).

Confirma que posso executar o plano assim?
