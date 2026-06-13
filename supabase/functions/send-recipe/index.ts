import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const sender = userData.user;

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const recipe = body.recipe;
    if (!email || !email.includes("@")) return json({ error: "E-mail inválido" }, 400);
    if (!recipe || !recipe.nome) return json({ error: "Receita inválida" }, 400);
    if (email === (sender.email ?? "").toLowerCase()) {
      return json({ error: "Você não pode enviar uma receita para si mesmo" }, 400);
    }

    // Find recipient by email
    let recipientId: string | null = null;
    for (let page = 1; page <= 10 && !recipientId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 500);
      const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) recipientId = match.id;
      if (data.users.length < 200) break;
    }
    if (!recipientId) return json({ error: "Nenhum usuário NutriPlus encontrado com esse e-mail" }, 404);

    // Sender name from profiles (optional)
    const { data: prof } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", sender.id)
      .maybeSingle();

    const { error: insertErr } = await supabase.from("shared_recipes").insert({
      sender_id: sender.id,
      recipient_id: recipientId,
      sender_email: sender.email ?? null,
      sender_name: prof?.nome ?? null,
      nome: String(recipe.nome),
      dados: recipe,
    });
    if (insertErr) return json({ error: insertErr.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
