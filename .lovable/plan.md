## Trial gratuito de 7 dias com bloqueio do dashboard

Implementar um período de teste de 7 dias para o plano gratuito (Essencial). Após esse prazo, sem assinatura ativa no Stripe, o dashboard fica bloqueado e o usuário é direcionado a uma tela de "Assine para continuar".

### 1. Banco de dados (migração)

Adicionar coluna na tabela `profiles`:
- `trial_ends_at` (timestamp with time zone, nullable) — data/hora em que o trial expira.

Atualizar a função `handle_new_user()` para preencher `trial_ends_at = now() + interval '7 days'` automaticamente em todo novo cadastro.

Backfill: para perfis existentes sem `trial_ends_at`, definir como `created_at + 7 days` (apenas para usuários no plano `essencial`).

### 2. Lógica de acesso (frontend)

**`SubscriptionContext`**: incluir `trialEndsAt` e `trialExpired` no estado. Buscar `trial_ends_at` da tabela `profiles` em paralelo ao `check-subscription`. Considerar:
- `trialExpired = true` quando `plano === 'essencial'`, `subscribed === false` e `now > trial_ends_at`.
- Assinantes pagos (Equilíbrio/Performance) nunca ficam expirados.

**Novo componente `TrialGuard`** (em `src/layouts/DashboardLayout.tsx`): se `trialExpired`, em vez de renderizar `<Outlet />`, mostra uma tela cheia "Seu período gratuito terminou" com:
- Resumo dos 3 planos (reaproveitar dados de `PLAN_CONFIG`).
- Botões para assinar cada plano (chama `create-checkout` e abre Stripe em nova aba).
- Botão "Sair".
- A sidebar continua visível mas todos os links ficam desabilitados/com cadeado.

**Banner de aviso**: quando faltarem ≤3 dias para expirar e o usuário ainda for `essencial`, mostrar banner no topo do dashboard com contador "Faltam X dias do seu período gratuito" + CTA "Assinar agora".

### 3. Edge function

Atualizar `check-subscription` para também retornar `trial_ends_at` (lendo de `profiles`), para manter uma única fonte de verdade no contexto.

### 4. Pontos técnicos

- O bloqueio é **client-side** (UX). RLS continua permitindo acesso aos dados do próprio usuário — isso é aceitável porque o objetivo é forçar a conversão, não esconder dados sensíveis.
- O cálculo de expiração usa o relógio do servidor via `trial_ends_at` retornado pelo backend, evitando manipulação no cliente.
- Após o pagamento bem-sucedido, `check-subscription` detecta a assinatura ativa e `trialExpired` passa a ser `false` automaticamente (já que assinantes pagos são imunes).
- A tela de bloqueio reaproveita o fluxo de checkout existente (`supabase.functions.invoke("create-checkout", { body: { priceId } })`).

### Arquivos a alterar/criar

- Migração SQL (nova): adicionar coluna + atualizar `handle_new_user` + backfill.
- `supabase/functions/check-subscription/index.ts`: incluir `trial_ends_at` na resposta.
- `src/contexts/SubscriptionContext.tsx`: novos campos `trialEndsAt`, `trialExpired`, `daysLeftInTrial`.
- `src/layouts/DashboardLayout.tsx`: integrar `TrialGuard`.
- `src/components/dashboard/TrialExpired.tsx` (novo): tela de bloqueio com planos.
- `src/components/dashboard/TrialBanner.tsx` (novo): banner de contagem regressiva.
