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
    } else if (type === "receita") {
      systemPrompt = `Você é um chef brasileiro criativo. Crie uma receita completa e MUITO DETALHADA usando os ingredientes fornecidos.
O modo_preparo deve ter passos bem explicados com detalhes de técnica culinária, tempos de cocção, temperaturas e indicações visuais de quando o alimento está pronto.
Responda APENAS com JSON válido: { "nome": "...", "descricao": "...", "tempo_preparo": "ex: 45 minutos", "dificuldade": "fácil" ou "médio" ou "difícil", "porcoes": "...", "ingredientes": ["ingrediente com quantidade"], "modo_preparo": ["passo 1 muito detalhado", "passo 2 muito detalhado", ...], "informacoes_nutricionais": { "calorias": "...", "proteinas": "...", "carboidratos": "...", "gorduras": "...", "fibras": "..." }, "dicas": "..." }`;
      userPrompt = `Crie uma receita detalhada usando estes ingredientes: ${ingredients}`;
    } else if (type === "chat") {
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
        ...(stream ? {} : { max_tokens: 16000 }),
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

    // Robust parsing: read as text first, then extract JSON
    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse gateway response, attempting extraction from raw text");
      // Try to extract the content field manually
      const contentMatch = rawText.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
      if (contentMatch) {
        return new Response(JSON.stringify({ content: contentMatch[1] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Resposta da IA foi incompleta. Tente novamente." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
