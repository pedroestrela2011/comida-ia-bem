import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { type, messages, preferences, ingredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "cardapio") {
      systemPrompt = `Você é um nutricionista brasileiro especializado. Gere um cardápio semanal completo (segunda a domingo) em JSON.
Cada dia deve ter: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar.
Cada refeição deve ser BEM DETALHADA com: { "nome": "...", "descricao": "breve descrição", "ingredientes": ["ingrediente com quantidade exata"], "modo_preparo": ["passo 1 muito detalhado explicando técnica, tempo e temperatura", "passo 2 muito detalhado com dicas de textura e ponto ideal", ...], "tempo_preparo": "ex: 30 minutos", "dificuldade": "fácil" ou "médio" ou "difícil", "informacoes_nutricionais": { "calorias": "...", "proteinas": "...", "carboidratos": "...", "gorduras": "...", "fibras": "..." }, "dicas": "dica útil para esta refeição" }
O modo_preparo deve ter passos bem explicados, com detalhes de técnica culinária, tempos de cocção, temperaturas e indicações visuais de quando o alimento está no ponto.
Responda APENAS com JSON válido no formato: { "cardapio": { "segunda": { ... }, "terca": { ... }, ... } , "lista_compras": ["item1", "item2", ...] }`;
      const p = preferences;
      userPrompt = `Gere um cardápio semanal para ${p.pessoas || 1} pessoa(s).
Objetivo: ${p.objetivo || "alimentação saudável"}
Orçamento: ${p.orcamento || "moderado"}
Alimentos que gosta: ${p.preferencias || "nenhuma preferência especial"}
Alimentos que NÃO gosta (EVITAR no cardápio): ${p.nao_gosta || "nenhum"}
Restrições: ${p.restricoes || "nenhuma"}
Deficiências nutricionais: ${p.deficiencias || "nenhuma"}`;
    } else if (type === "cardapio_esporte") {
      systemPrompt = `Você é um nutricionista esportivo brasileiro especializado. Gere um cardápio semanal completo (segunda a domingo) em JSON, personalizado para atletas e praticantes de atividade física.
Cada dia deve ter: cafe_da_manha, almoco, jantar, lanche_pre_treino, lanche_pos_treino.
Cada refeição deve ser BEM DETALHADA com: { "nome": "...", "descricao": "breve descrição focada no benefício esportivo", "ingredientes": ["ingrediente com quantidade exata"], "modo_preparo": ["passo 1 muito detalhado", "passo 2 muito detalhado", ...], "tempo_preparo": "ex: 30 minutos", "dificuldade": "fácil" ou "médio" ou "difícil", "informacoes_nutricionais": { "calorias": "...", "proteinas": "...", "carboidratos": "...", "gorduras": "...", "fibras": "..." }, "vitaminas": ["Vitamina A", "Vitamina C", ...], "minerais": ["Ferro", "Magnésio", ...], "beneficio_esportivo": "explicação de como esta refeição ajuda no desempenho/recuperação", "dicas": "dica útil" }
O cardápio deve priorizar: reposição de glicogênio, recuperação muscular, hidratação, energia sustentada e micronutrientes essenciais para o esporte praticado.
Responda APENAS com JSON válido no formato: { "cardapio": { "segunda": { ... }, "terca": { ... }, ... }, "lista_compras": ["item1", "item2", ...], "resumo_nutricional": "breve resumo das estratégias nutricionais adotadas" }`;
      const sp = preferences;
      userPrompt = `Gere um cardápio semanal esportivo personalizado.
Esporte praticado: ${sp.esporte || "não especificado"}
Frequência de treino: ${sp.frequencia || "não especificado"} vezes por semana
Intensidade: ${sp.intensidade || "moderado"}
Desconfortos durante o treino: ${sp.desconforto || "nenhum"}
Sente fraqueza/falta de energia: ${sp.fraqueza || "não"}
Objetivo: ${sp.objetivo || "melhorar desempenho"}
Restrições alimentares: ${sp.restricoes || "nenhuma"}`;
    } else if (type === "substituir_refeicao") {
      systemPrompt = `Você é um nutricionista brasileiro especializado. O usuário quer trocar uma refeição do cardápio por outra que goste mais.
Gere UMA refeição substituta que mantenha o equilíbrio nutricional similar.
Responda APENAS com JSON válido: { "nome": "...", "descricao": "breve descrição", "ingredientes": ["ingrediente com quantidade exata"], "modo_preparo": ["passo 1 detalhado", "passo 2 detalhado", ...], "tempo_preparo": "ex: 30 minutos", "dificuldade": "fácil" ou "médio" ou "difícil", "informacoes_nutricionais": { "calorias": "...", "proteinas": "...", "carboidratos": "...", "gorduras": "...", "fibras": "..." }, "dicas": "dica útil" }`;
      const sub = preferences;
      userPrompt = `A refeição atual é: "${sub.refeicao_atual}" (${sub.tipo_refeicao}).
O usuário quer uma alternativa diferente.
${sub.preferencia ? `O usuário gostaria de algo como: ${sub.preferencia}` : "Sugira algo diferente mas equilibrado."}
Objetivo nutricional: ${sub.objetivo || "alimentação saudável"}
Restrições: ${sub.restricoes || "nenhuma"}`;
    } else if (type === "receita") {
      systemPrompt = `Você é um chef brasileiro criativo. Crie uma receita completa e MUITO DETALHADA usando os ingredientes fornecidos.
O modo_preparo deve ter passos bem explicados com detalhes de técnica culinária, tempos de cocção, temperaturas e indicações visuais de quando o alimento está pronto.
Responda APENAS com JSON válido: { "nome": "...", "descricao": "...", "tempo_preparo": "ex: 45 minutos", "dificuldade": "fácil" ou "médio" ou "difícil", "porcoes": "...", "ingredientes": ["ingrediente com quantidade"], "modo_preparo": ["passo 1 muito detalhado", "passo 2 muito detalhado", ...], "informacoes_nutricionais": { "calorias": "...", "proteinas": "...", "carboidratos": "...", "gorduras": "...", "fibras": "..." }, "dicas": "..." }`;
      userPrompt = `Crie uma receita detalhada usando estes ingredientes: ${ingredients}`;
    } else if (type === "identificar_alimentos_foto") {
      // Use vision model to identify foods from photo
      const imageUrl = preferences.image_base64;
      const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Identifique todos os alimentos visíveis nesta foto de um prato de comida. Responda APENAS com uma lista simples dos alimentos, um por linha, sem numeração, sem explicações extras. Se não conseguir identificar alimentos, responda 'não identificado'."
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
        }),
      });

      if (!visionResponse.ok) {
        const t = await visionResponse.text();
        console.error("Vision error:", visionResponse.status, t);
        return new Response(JSON.stringify({ error: "Erro ao analisar a foto." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const visionData = await visionResponse.json();
      const identified = visionData.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ content: identified }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "analisador_prato") {
      systemPrompt = `Você é um nutricionista brasileiro especializado em análise nutricional de refeições.
Analise os alimentos informados pelo usuário e forneça uma análise nutricional estimada completa, ALÉM de uma receita prática para preparar este prato.
Responda APENAS com JSON válido no formato:
{
  "nome_prato": "nome descritivo do prato",
  "macronutrientes": {
    "calorias": "valor estimado em kcal",
    "proteinas": "valor em gramas",
    "carboidratos": "valor em gramas",
    "gorduras": "valor em gramas",
    "fibras": "valor em gramas"
  },
  "vitaminas": [
    { "nome": "Vitamina A", "quantidade": "estimativa", "beneficio": "breve benefício" }
  ],
  "minerais": [
    { "nome": "Ferro", "quantidade": "estimativa", "beneficio": "breve benefício" }
  ],
  "feedback": [
    "feedback positivo ou sugestão 1",
    "feedback positivo ou sugestão 2",
    "feedback positivo ou sugestão 3"
  ],
  "pontuacao_saude": 7,
  "resumo": "Um breve resumo geral sobre a qualidade nutricional do prato",
  "receita": {
    "tempo_preparo": "ex: 25 minutos",
    "porcoes": "ex: Serve 2 pessoas",
    "dificuldade": "fácil" ou "médio" ou "difícil",
    "ingredientes": ["100g de macarrão", "150g de frango", "molho de tomate", "temperos"],
    "modo_preparo": ["Passo 1 detalhado", "Passo 2 detalhado", "..."],
    "dicas": "dica útil e saudável de preparo"
  }
}
A pontuacao_saude deve ser de 1 a 10 (10 = muito saudável).
A receita deve ser COERENTE com os alimentos informados, focada em alimentação saudável e adaptada ao objetivo do usuário (se informado: emagrecimento → menos gordura; ganho de massa → mais proteína).
Os passos do modo_preparo devem ser claros, com técnica, tempos e indicações visuais quando relevante.
Seja preciso nas estimativas e educativo nos feedbacks. Use português do Brasil.`;
      userPrompt = `Analise nutricionalmente e gere a receita do seguinte prato com estes alimentos: ${preferences.alimentos}${preferences.objetivo ? `\nObjetivo do usuário: ${preferences.objetivo}` : ""}`;
    } else if (type === "chat") {
      // Enforce daily chatbot question limit based on user's plan
      const userId = claimsData.claims.sub as string;
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { data: profile } = await serviceClient
        .from("profiles")
        .select("plano")
        .eq("user_id", userId)
        .maybeSingle();

      const plano = (profile?.plano || "essencial").toLowerCase();
      const LIMITS: Record<string, number> = {
        essencial: 7,
        equilibrio: 15,
        "equilíbrio": 15,
        performance: 25,
      };
      const limit = LIMITS[plano] ?? 7;

      const today = new Date().toISOString().slice(0, 10);
      const { data: usageRow } = await serviceClient
        .from("chatbot_usage")
        .select("id, count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

      const currentCount = usageRow?.count ?? 0;
      if (currentCount >= limit) {
        return new Response(
          JSON.stringify({
            error: `Você atingiu o limite diário de ${limit} perguntas do seu plano. Tente novamente amanhã ou faça upgrade.`,
            limit_reached: true,
            limit,
            used: currentCount,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (usageRow) {
        await serviceClient
          .from("chatbot_usage")
          .update({ count: currentCount + 1 })
          .eq("id", usageRow.id);
      } else {
        await serviceClient
          .from("chatbot_usage")
          .insert({ user_id: userId, usage_date: today, count: 1 });
      }

      systemPrompt = `Você é o "Conversa Saudável", um assistente de saúde amigável e educativo. 
Responda dúvidas sobre alimentos, nutrição e hábitos alimentares saudáveis.
Use tom acolhedor, acessível e educativo. Responda em português do Brasil.
Não dê diagnósticos médicos. Sugira sempre procurar um profissional quando necessário.
Use emojis ocasionalmente para ser mais amigável.`;
    }


    const aiMessages = type === "chat"
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }];

    const stream = type === "chat";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo com IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
