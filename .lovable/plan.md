# Transição Premium Hero → Próxima Seção

Criar uma transição cinematográfica entre o Hero e a seção ProblemSolution, usando uma onda luminosa vertical controlada pelo scroll, com saída suave dos elementos do Hero e entrada escalonada dos cards da próxima seção.

## O que o usuário vai ver

1. Ao iniciar o scroll, uma faixa luminosa horizontal (gradiente verde→âmbar com leve blur) desce pela tela acompanhando o progresso do scroll.
2. Conforme a onda avança, o conteúdo do Hero (título, subtítulo, botões, estatísticas) recua suavemente: leve translateY para cima + blur progressivo + fade.
3. Atrás da onda, o background da nova seção é revelado por uma máscara (clip-path) que desce sincronizada à onda.
4. Quando a onda termina de passar, os elementos da ProblemSolution entram em sequência:
   - Título e subtítulo primeiro (fade + slide-up curto)
   - Os 4 cards de problema em cascata (stagger ~80ms)
   - Bloco de solução por último, com um brilho discreto pulsando uma vez nos ícones
5. Ícones recebem um glow sutil (box-shadow com cor primária baixa opacidade) ao entrarem em viewport.

Sensação: continuidade, como se a próxima seção fosse "pintada" pela luz, não uma troca de tela.

## Estrutura de implementação

### Novo componente: `src/components/landing/SectionTransition.tsx`
Wrapper de transição reutilizável. Renderiza:
- Uma `div` fixa absoluta posicionada entre o Hero e a próxima seção
- A "onda" = barra horizontal de ~120px de altura com gradiente luminoso e blur, animada via `transform: translateY()` controlado por scroll progress
- Uma máscara/overlay que revela a seção de baixo conforme a onda passa

Usa `framer-motion` (`useScroll` + `useTransform`) para mapear o progresso de scroll (do final do Hero até ~30% da próxima seção) em:
- `y` da onda (0 → 100vh)
- `opacity` e `filter: blur()` dos filhos do Hero
- `clipPath` do reveal da nova seção

### Edição: `src/components/landing/Hero.tsx`
- Envolver o bloco de conteúdo num `motion.div` que reage ao scroll progress compartilhado (via prop ou contexto leve), aplicando saída com translateY + blur + fade.
- Sem mudar copy, imagens ou layout.

### Edição: `src/components/landing/ProblemSolution.tsx`
- Trocar as `animate-fade-in` CSS atuais por `motion.div` com `whileInView` + `viewport={{ once: true, margin: "-10%" }}`.
- Stagger nos 4 cards (delay incremental ~80ms).
- Título/subtítulo entram primeiro; bloco "A solução" entra por último com um pulso de glow único nos ícones (`animate` em `boxShadow`).

### Edição: `src/pages/Index.tsx`
- Inserir `<SectionTransition />` entre `<Hero />` e `<ProblemSolution />`, ou envolver os dois num container que provê o scroll progress.

## Detalhes técnicos

- Biblioteca: `framer-motion` (já compatível com o stack; instalar se ausente).
- Performance:
  - Apenas `transform`, `opacity`, `filter` e `clip-path` animados (GPU-friendly).
  - `will-change` aplicado só durante a transição.
  - Respeitar `prefers-reduced-motion`: desabilita onda e usa fade curto.
- Cores: tokens existentes (`--primary`, `--accent`, `--green-300`) — sem cores hardcoded.
- Mobile: onda com altura reduzida (~80px) e blur menor; mesmas animações com distâncias menores.
- Sem mudanças de backend, schema, copy ou assets.

## Arquivos
- Criar: `src/components/landing/SectionTransition.tsx`
- Editar: `src/components/landing/Hero.tsx`, `src/components/landing/ProblemSolution.tsx`, `src/pages/Index.tsx`
- Dependência: garantir `framer-motion` instalado
