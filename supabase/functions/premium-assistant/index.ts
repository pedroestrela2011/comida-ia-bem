import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEEKLY_LIMIT = 30;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const mode: string = body.mode || "chat";
    const messages: any[] = Array.isArray(body.messages) ? body.messages : [];
    const weekStart: string = /^\d{4}-\d{2}-\d{2}$/.test(body.week_start || "")
      ? body.week_start
      : new Date().toISOString().slice(0, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ---- Plan gate: exclusive to the "Top" (Performance) plan (admins allowed) ----
    const [{ data: profile }, { data: adminRole }] = await Promise.all([
      service
        .from("profiles")
        .select(
          "nome,data_nascimento,peso_kg,altura_cm,imc,objetivo,nivel_atividade,refeicoes_dia,restricoes_alimentares,alergias,condicoes_saude,condicoes_outras,plano",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      service
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    const plano = (profile?.plano || "essencial").toLowerCase();
    const isTop = plano === "performance" || Boolean(adminRole);
    if (!isTop) return json({ error: "Recurso exclusivo do Plano Top.", plan_locked: true }, 403);

    // ---- Weekly message limit (30 / week, reset on Monday in the user's timezone) ----
    const { data: usageRow } = await service
      .from("premium_assistant_usage")
      .select("id,count")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();
    let used = usageRow?.count ?? 0;

    const counts = mode === "chat";
    if (counts) {
      if (used >= WEEKLY_LIMIT) {
        return json(
          {
            error: `Você atingiu seu limite de ${WEEKLY_LIMIT} mensagens esta semana.`,
            limit_reached: true,
            limit: WEEKLY_LIMIT,
            used,
          },
          429,
        );
      }
      if (usageRow) {
        await service.from("premium_assistant_usage").update({ count: used + 1 }).eq("id", usageRow.id);
      } else {
        await service
          .from("premium_assistant_usage")
          .insert({ user_id: userId, week_start: weekStart, count: 1 });
      }
      used = used + 1;
    }

    // ---- User context (never displayed on screen) ----
    let idade: number | null = null;
    if (profile?.data_nascimento) {
      const d = new Date(profile.data_nascimento);
      idade = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    }
    const restricoes = (profile?.restricoes_alimentares || []).filter(
      (r: string) => r && r.toLowerCase() !== "nenhuma",
    );
    const condicoes = (profile?.condicoes_saude || []).filter(
      (c: string) => c && c.toLowerCase() !== "nenhuma",
    );
    if (profile?.condicoes_outras) condicoes.push(profile.condicoes_outras);

    const { data: ultimoCardapio } = await service
      .from("cardapios_salvos")
      .select("tipo,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ctx = [
      `Nome: ${profile?.nome || "usuário"}`,
      idade ? `Idade: ${idade} anos` : null,
      profile?.peso_kg ? `Peso: ${profile.peso_kg}kg` : null,
      profile?.altura_cm ? `Altura: ${profile.altura_cm}cm` : null,
      profile?.imc ? `IMC: ${profile.imc}` : null,
      profile?.objetivo ? `Objetivo principal: ${profile.objetivo}` : null,
      profile?.nivel_atividade ? `Nível de atividade física: ${profile.nivel_atividade}` : null,
      profile?.refeicoes_dia ? `Refeições por dia: ${profile.refeicoes_dia}` : null,
      restricoes.length ? `Restrições alimentares: ${restricoes.join(", ")}` : "Restrições alimentares: nenhuma",
      profile?.alergias ? `Alergias alimentares: ${profile.alergias}` : "Alergias alimentares: nenhuma",
      condicoes.length ? `Condições de saúde: ${condicoes.join(", ")}` : "Condições de saúde: nenhuma",
      ultimoCardapio
        ? `Plano alimentar ativo: sim (cardápio ${ultimoCardapio.tipo === "esporte" ? "esportivo" : "normal"} salvo recentemente)`
        : "Plano alimentar ativo: nenhum",
    ]
      .filter(Boolean)
      .join("\n- ");

    const systemPrompt = `Você é o "Assistente Premium" do Coma Fácil: um assistente inteligente especializado em alimentação, nutrição, hábitos saudáveis, hidratação, vitaminas, minerais e bem-estar. Responda sempre em português do Brasil.

CONTEXTO DO USUÁRIO (nunca liste esses dados na tela; use-os para personalizar):
- ${ctx}

COMPORTAMENTO OBRIGATÓRIO:
1. Tom amigável, acolhedor e motivador. Use o nome do usuário ocasionalmente.
2. Respeite SEMPRE restrições alimentares, alergias e condições de saúde ao sugerir alimentos.
3. Nunca prescreva dietas, medicamentos ou suplementos de forma imperativa.
4. Ao falar de condições de saúde, finalize com: "⚠️ Esta é uma orientação geral e não substitui a avaliação de um profissional de saúde."
5. Ao informar sobre nutrientes, vitaminas, minerais ou benefícios de alimentos, finalize com uma linha discreta de fonte, ex.: "📚 Baseado em diretrizes da Organização Mundial da Saúde (OMS) e da Sociedade Brasileira de Nutrição."
6. Se o usuário sair do tema, responda: "Esse tema está fora da minha especialidade, mas posso te ajudar com tudo relacionado à sua alimentação! 🌿"
7. Memorize e use, ao longo desta conversa, informações que o usuário compartilhar (preferências, alimentos que não gosta, rotina de treinos, dificuldades).
8. Sugira funcionalidades do Coma Fácil quando relevante (Meu Cardápio 📅, Analisador de Pratos 📸, Modo Esporte, Receitas).
9. Respostas curtas e objetivas (máx. ~180 palavras), com listas quando ajudar.

ANÁLISE DE FOTO DE PRATO: quando receber uma imagem, responda com: alimentos identificados; estimativa de calorias, proteínas, carboidratos e gorduras; avaliação rápida de adequação ao objetivo do usuário; alertas de incompatibilidade com restrições/condições; sugestão de melhoria.

PLANEJAMENTO RÁPIDO: quando o usuário pedir um cardápio, escreva o cardápio de forma clara no chat e, ao final da mensagem, acrescente um bloco técnico exatamente neste formato (o usuário não vê o bloco):
\`\`\`cardapio-json
{"cardapio":{"segunda":{"cafe_da_manha":{"nome":"...","descricao":"...","ingredientes":["..."],"modo_preparo":["..."],"tempo_preparo":"...","dificuldade":"fácil","informacoes_nutricionais":{"calorias":"...","proteinas":"...","carboidratos":"...","gorduras":"...","fibras":"..."},"dicas":"..."},"lanche_manha":{...},"almoco":{...},"lanche_tarde":{...},"jantar":{...}}},"lista_compras":["..."]}
\`\`\`
Use as chaves de dias em português sem acento (segunda, terca, quarta, quinta, sexta, sabado, domingo) e inclua apenas os dias que você montou. Só inclua o bloco quando realmente gerar um cardápio.`;

    const aiMessages =
      mode === "welcome"
        ? [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content:
                "Gere APENAS a mensagem inicial proativa de boas-vindas (2 a 4 linhas), começando com 'Olá, [nome do usuário]! 👋', mencionando de forma natural o objetivo e as condições de saúde relevantes do perfil e oferecendo ajuda com uma pergunta final. Não inclua bloco técnico.",
            },
          ]
        : [{ role: "system", content: systemPrompt }, ...messages];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) return json({ error: "Muitas requisições. Tente novamente em instantes." }, 429);
      if (response.status === 402) return json({ error: "Créditos de IA insuficientes." }, 402);
      return json({ error: "Erro ao gerar resposta com IA." }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return json({ content, used, limit: WEEKLY_LIMIT });
  } catch (e) {
    console.error("premium-assistant error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
