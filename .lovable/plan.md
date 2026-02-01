

# ComaBem - Plano de Implementação

## 🎯 Visão Geral
Site de nutrição e planejamento alimentar com IA, visual verde e natural, focado em usabilidade e conversão.

---

## 📄 Fase 1: Landing Page
Uma página inicial atraente e focada em conversão:

- **Header fixo** com navegação: Preços, Como Funciona, Benefícios + botão destacado "Comece Já"
- **Hero section** com imagem apetitosa de comida saudável, título impactante e chamada para ação
- **Seção de avaliações** com depoimentos de usuários satisfeitos
- **Benefícios do ComaBem** em cards visuais (economia de tempo, alimentação personalizada, praticidade)
- **Como funciona** em 3 passos simples ilustrados
- **Demonstração visual** com capturas de tela do dashboard
- **CTA final** incentivando o cadastro

---

## 🔐 Fase 2: Autenticação e Planos

**Cadastro com os campos:**
- Nome, Data de nascimento, País, Email e Senha

**Tela de seleção de planos:**
- Básico (R$19,99), Pro (R$49,90) em destaque, Premium (R$69,90)
- Visual de cards comparativos
- Checkout simulado (sem integração real por enquanto)

---

## 🏠 Fase 3: Dashboard Interno
Interface com sidebar (menu lateral) e área de conteúdo principal:

### 🥗 Meu Cardápio
- Formulário de preferências: objetivo, orçamento, pessoas, gostos/restrições, deficiências
- Geração de cardápio semanal com IA (segunda a domingo)
- Cada refeição com: foto, nome do prato, receita detalhada
- Lista de compras automática gerada a partir do cardápio
- Histórico de cardápios salvos automaticamente

### 🍝 Receitas
- Campo para inserir ingredientes disponíveis
- IA cria receita completa: nome, ingredientes, modo de preparo, foto
- Biblioteca de receitas salvas pelo usuário

### 💬 Conversa Saudável
- Chatbot com visual amigável de mensagens
- Respostas educativas sobre nutrição e alimentos
- Tom acolhedor e acessível

### ⚙️ Configurações
- Edição de dados pessoais e foto de perfil
- Alteração de senha
- Toggle de modo escuro
- Gerenciamento de preferências

---

## 🤖 Fase 4: Integração com IA
Usando Lovable AI (Google Gemini) para:
- Gerar cardápios semanais personalizados
- Criar receitas a partir de ingredientes
- Responder dúvidas sobre nutrição no chatbot

---

## 🎨 Design
- **Paleta:** Tons de verde, bege, cores terrosas e naturais
- **Tipografia:** Moderna e legível
- **Visual:** Limpo, acolhedor, com fotos de alimentos frescos
- **Responsivo:** Funciona perfeitamente em desktop e mobile

---

## 💾 Dados (Backend)
O projeto usará Lovable Cloud para:
- Autenticação de usuários
- Armazenamento de perfis e preferências
- Salvamento de cardápios e receitas criados
- Histórico de conversas do chatbot

