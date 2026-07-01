import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é uma nutricionista brasileira especialista em ADAPTAÇÃO de dietas prescritas.
Sua tarefa é receber um plano alimentar elaborado por um nutricionista (em texto, imagem ou PDF) e produzir uma versão ADAPTADA à rotina, preferências e realidade do usuário, mantendo os objetivos nutricionais do plano original.

REGRAS:
1) NUNCA mude o objetivo nutricional do plano original (ex: se é hipercalórico, mantenha hipercalórico).
2) Substitua alimentos por equivalentes nutricionais que o usuário GOSTA e respeite restrições/alergias.
3) Ajuste horários das refeições à rotina informada.
4) Considere tempo de preparo e orçamento.
5) Aponte pontos difíceis do plano original e como você resolveu.

Responda APENAS com JSON válido no formato:
{
  "plano_original": {
    "resumo": "resumo curto do que o nutricionista prescreveu",
    "objetivos": ["objetivo 1", "objetivo 2"],
    "restricoes_identificadas": ["..."],
    "refeicoes": [
      { "nome": "Café da manhã", "horario_original": "07:00", "itens": [{"alimento": "aveia", "quantidade": "40g"}] }
    ]
  },
  "plano_adaptado": {
    "resumo": "resumo do que foi adaptado e por quê",
    "refeicoes": [
      {
        "nome": "Café da manhã",
        "horario": "07:30",
        "itens": [{"alimento": "...", "quantidade": "..."}],
        "receita": {
          "nome": "...",
          "tempo_preparo": "10 min",
          "dificuldade": "fácil",
          "ingredientes": ["..."],
          "modo_preparo": ["passo 1 detalhado", "passo 2 detalhado"],
          "beneficios": "por que essa refeição funciona nutricionalmente"
        },
        "substituicoes_feitas": ["troquei X por Y porque..."]
      }
    ]
  },
  "lista_compras": {
    "semanal": {
      "proteinas": ["..."],
      "hortifruti": ["..."],
      "laticinios": ["..."],
      "graos_e_cereais": ["..."],
      "temperos": ["..."],
      "outros": ["..."]
    },
    "mensal_estoque": ["itens de estoque para o mês"]
  },
  "dificuldades_originais": [
    { "ponto": "refeição X às 15h é incompatível com a rotina", "solucao": "movi para 16h30 e simplifiquei o preparo" }
  ],
  "compatibilidade": {
    "pontuacao": 92,
    "justificativa": "Explicação em 2-3 frases da nota."
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { source, personalization } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `PERSONALIZAÇÃO DO USUÁRIO:
- Horários habituais: ${personalization.horarios || "não informado"}
- Gosta de: ${personalization.gosta || "sem preferência específica"}
- NÃO gosta / evita: ${personalization.nao_gosta || "nenhum"}
- Alergias / restrições: ${personalization.alergias || "nenhuma"}
- Rotina (trabalho/estudo): ${personalization.rotina || "não informada"}
- Tempo disponível para cozinhar: ${personalization.tempo_cozinhar || "moderado"}
- Orçamento mensal: ${personalization.orcamento || "moderado"}

Analise o plano alimentar enviado (a seguir) e gere a versão ADAPTADA no JSON solicitado. Mantenha rigorosamente o objetivo nutricional original.`;

    // Build content parts based on source type
    const userContent: any[] = [{ type: "text", text: userPrompt }];
    if (source.type === "text") {
      userContent.push({ type: "text", text: `\n\nPLANO ALIMENTAR ORIGINAL (texto):\n${source.content}` });
    } else if (source.type === "image") {
      userContent.push({ type: "text", text: "\n\nPLANO ALIMENTAR ORIGINAL (imagem em anexo):" });
      userContent.push({ type: "image_url", image_url: { url: source.content } });
    } else if (source.type === "pdf") {
      userContent.push({ type: "text", text: "\n\nPLANO ALIMENTAR ORIGINAL (PDF em anexo):" });
      userContent.push({
        type: "file",
        file: { filename: source.filename || "plano.pdf", file_data: source.content },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Contate o suporte." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Erro ao adaptar dieta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("adaptar-dieta error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
