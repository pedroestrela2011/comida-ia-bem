## Objetivo

Inserir um fluxo de onboarding de saúde em 3 etapas entre o cadastro (`/cadastro`) e o painel de planos (`/escolher-plano`), sem tocar em nenhum dos dois. Persistir os dados no perfil e usá-los automaticamente nas funções existentes.

## Fluxo

```text
/cadastro  →  /onboarding-saude  →  /escolher-plano  →  checkout (inalterado)
```

- Etapa 1 (Corpo): peso, altura → calcula IMC; idade vem da data de nascimento; unidades vêm do país (Brasil kg/cm, EUA lb/ft, resto kg/cm).
- Etapa 2 (Objetivos): objetivo principal, nível de atividade, refeições/dia.
- Etapa 3 (Saúde): restrições (multi), alergias (texto), condições (multi + "Outras" livre) + aviso.
- Barra de progresso "Etapa X de 3", visual verde escuro atual, botões Voltar/Continuar/Concluir.

## Persistência

Como o cadastro só chama `signUp` na etapa `/escolher-plano` (após escolher o plano), o onboarding **não** pode salvar direto no `profiles` ainda (usuário não existe). Estratégia:

1. `Cadastro` já grava `pending_signup_v1` em `sessionStorage`.
2. Nova página `/onboarding-saude` lê esse objeto, adiciona `health: {...}` e regrava no `sessionStorage`.
3. `EscolherPlano` (sem alterar sua UI/fluxo de checkout) passa a incluir `health` no `raw_user_meta_data` do `signUp`.
4. `handle_new_user` (trigger) copia os campos de saúde para `profiles`.

Se `EscolherPlano` não for aberto sem passar pelo onboarding, adiciono um guard leve no início dessa página que redireciona para `/onboarding-saude` quando `pending_signup_v1` existe mas não tem `health` (não altera visualmente a página).

## Migração de banco

Adicionar colunas em `public.profiles`:

- `peso_kg numeric`, `altura_cm numeric`, `imc numeric`
- `objetivo text`, `nivel_atividade text`, `refeicoes_dia int`
- `restricoes_alimentares text[]`, `alergias text`
- `condicoes_saude text[]`, `condicoes_outras text`
- `unidade_peso text` ('kg'|'lb'), `unidade_altura text` ('cm'|'ft'), `idioma text` ('pt'|'en')
- `onboarding_completo boolean default false`

Atualizar `handle_new_user` para popular esses campos a partir de `raw_user_meta_data.health` e derivar `unidade_*`/`idioma` do `pais`.

## Integração com funções

Adicionar hook `useHealthProfile()` que retorna os dados de saúde do perfil. Ajustes mínimos e localizados:

- **Cardápio** (`pages/dashboard/Cardapio.tsx`): pré-preencher objetivo, refeições, restrições; enviar `condicoes_saude` ao edge function do cardápio como contexto extra.
- **Receitas** (`pages/dashboard/Receitas.tsx`): filtrar/marcar receitas com ingredientes em `restricoes/condicoes`; aviso quando bate com `alergias`.
- **Modo Esporte** (`pages/dashboard/ModoEsporte.tsx`): pré-preencher peso, altura, nível de atividade, objetivo. Se `objetivo === "Melhorar Performance Esportiva"`, tooltip/CTA no primeiro acesso ao dashboard (flag em localStorage).
- **Analisador de Pratos**: enviar condições/restrições ao edge function; renderizar alerta vermelho quando resposta marcar incompatibilidade.
- **Adaptador de Dietas**: enviar todo o perfil de saúde no payload do edge function `adaptar-dieta`.
- **Progresso**: usar `peso_kg`/`altura_cm` como baseline; exibir IMC com faixa (Abaixo/Normal/Sobrepeso/Obesidade); permitir atualização que também atualiza o profile.
- **Chat (ai-assistant)**: incluir bloco de contexto de saúde no system prompt quando `type === "chat"`.
- **Conquistas/Score**: destacar conquistas de esporte quando objetivo for performance.
- **Configurações**: nova aba/seção "Dados de Saúde" com formulário editável reaproveitando os componentes do onboarding.

## Arquivos novos

- `src/pages/OnboardingSaude.tsx` — orquestrador de 3 etapas + progress bar.
- `src/components/onboarding/StepCorpo.tsx`
- `src/components/onboarding/StepObjetivos.tsx`
- `src/components/onboarding/StepSaude.tsx`
- `src/lib/health.ts` — cálculo de IMC, faixa, conversões kg/lb e cm/ft, mapeamento país→unidade/idioma, listas de opções.
- `src/hooks/useHealthProfile.ts` — leitura/atualização do perfil de saúde.
- Rota `/onboarding-saude` em `src/App.tsx`.

## Arquivos alterados (mudanças pequenas e localizadas)

- `src/App.tsx` — adicionar rota.
- `src/pages/EscolherPlano.tsx` — incluir `health` no `raw_user_meta_data` do signUp + guard de redirect quando faltar health.
- `src/pages/dashboard/Configuracoes.tsx` — nova seção "Dados de Saúde".
- `src/pages/dashboard/{Cardapio,Receitas,ModoEsporte,AnalisadorPrato,AdaptadorDieta,Progresso,Chat}.tsx` — consumir `useHealthProfile` e passar contexto.
- `supabase/functions/{ai-assistant,adaptar-dieta}/index.ts` — aceitar/injetar contexto de saúde.
- Migração SQL (colunas + atualização da função `handle_new_user`).
- `src/integrations/supabase/types.ts` — regenerado após migração.

## Ordem de execução

1. Migração (colunas + `handle_new_user`).
2. Arquivos novos do onboarding + rota + guard em `EscolherPlano`.
3. Hook `useHealthProfile` + `lib/health.ts`.
4. Integração função por função + seção em Configurações.
5. Ajustes nos edge functions.

## Fora do escopo

- Não altero `Cadastro.tsx`, `EscolherPlano.tsx` (exceto o guard de redirect e o campo `health` no signUp), nem o fluxo de checkout Stripe.
- Não mudo visual do painel de planos.
