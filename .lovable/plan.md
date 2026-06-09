# Reestruturação da Página Inicial

Reorganizar `src/pages/Index.tsx` na ordem solicitada e criar as 2 seções que ainda não existem. As seções existentes serão mantidas como estão — apenas reordenadas.

## Nova ordem das seções

1. **Hero** (existe — `Hero.tsx`) — sem alterações
2. **Problema + Solução** (NOVO — criar `ProblemSolution.tsx`)
3. **Por que escolher a Coma Bem?** (existe — `Benefits.tsx`)
4. **Tudo o que você encontra** (existe — `Demo.tsx`, atualmente é o grid de funcionalidades)
5. **Como Funciona?** (existe — `HowItWorks.tsx`) — atualizar de 3 para 4 passos conforme pedido (Crie sua conta → Escolha seu objetivo → Receba seu plano → Acompanhe sua evolução)
6. **Demonstração Visual** (NOVO — criar `VisualDemo.tsx` com mockups/prints das telas: cardápio, analisador, receitas, progresso)
7. **Escolha seu Plano** (existe — `Pricing.tsx`)
8. **CTA Final** (existe — `CTA.tsx`)

Observação: `Reviews.tsx` (depoimentos) não está na nova ordem solicitada. Vou removê-lo da página inicial (o arquivo permanece no projeto caso queira reusar).

## Novos componentes

### `ProblemSolution.tsx`
- Título: "Cansado de não saber o que comer?"
- 4 cards de problemas com ícones Lucide: Falta de tempo (Clock), Dietas complicadas (AlertCircle), Gastos desnecessários (Wallet), Dificuldade para atingir objetivos (Target)
- Bloco de fechamento destacado: "A Coma Bem resolve isso para você." com gradiente sutil em tons verdes/terra

### `VisualDemo.tsx`
- Título: "Veja a Coma Bem em ação"
- 4 cards em grid mostrando as funcionalidades-chave (Criação de Cardápio, Analisador de Pratos, Receitas, Progresso)
- Como ainda não há vídeos/gifs reais, cada card terá um mockup visual estilizado (um frame com gradiente verde/terra, ícone grande Lucide e legenda) — pronto para o usuário substituir por GIFs/prints depois.

## Atualização de `HowItWorks.tsx`
- Trocar de 3 para 4 passos: Crie sua conta, Escolha seu objetivo, Receba seu plano, Acompanhe sua evolução
- Manter o mesmo estilo visual (círculos com ícones, numeração, linha conectora) — ajustar grid para 4 colunas em desktop

## Arquivos alterados

- `src/pages/Index.tsx` — nova ordem dos imports e seções, remover `<Reviews />`
- `src/components/landing/HowItWorks.tsx` — 4 passos
- `src/components/landing/ProblemSolution.tsx` — NOVO
- `src/components/landing/VisualDemo.tsx` — NOVO

Sem mudanças em backend, rotas, ou outras páginas. Estilo segue os tokens existentes (verde/terra, sem emojis na UI, ícones Lucide).
