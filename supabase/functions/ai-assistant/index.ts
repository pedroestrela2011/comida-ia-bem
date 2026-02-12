import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, messages, preferences, ingredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "cardapio") {
      systemPrompt = `Você é um nutricionista brasileiro especializado. Gere um cardápio semanal completo (segunda a domingo) em JSON.
Cada dia deve ter: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar.
Cada refeição: { "nome": "...", "descricao": "breve descrição", "ingredientes": ["..."], "modo_preparo": "..." }
Responda APENAS com JSON válido no formato: { "cardapio": { "segunda": { ... }, "terca": { ... }, ... } , "lista_compras": ["item1", "item2", ...] }`;
      const p = preferences;
      userPrompt = `Gere um cardápio semanal para ${p.pessoas || 1} pessoa(s).
Objetivo: ${p.objetivo || "alimentação saudável"}
Orçamento: ${p.orcamento || "moderado"}
Preferências: ${p.preferencias || "nenhuma especial"}
Restrições: ${p.restricoes || "nenhuma"}
Deficiências nutricionais: ${p.deficiencias || "nenhuma"}`;
    } else if (type === "receita") {
      systemPrompt = `Você é um chef brasileiro criativo. Crie uma receita completa usando os ingredientes fornecidos.
Responda APENAS com JSON válido: { "nome": "...", "descricao": "...", "tempo_preparo": "...", "porcoes": "...", "ingredientes": ["..."], "modo_preparo": ["passo 1", "passo 2", ...], "dicas": "..." }`;
      userPrompt = `Crie uma receita usando estes ingredientes: ${ingredients}`;
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
