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
    const caller = userData.user;

    // Verify caller is admin
    const { data: isAdminData } = await supabase.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdminData) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);

      // Fetch emails via admin API
      const enriched = await Promise.all(
        (roles ?? []).map(async (r) => {
          const { data } = await supabase.auth.admin.getUserById(r.user_id);
          return {
            user_id: r.user_id,
            email: data?.user?.email ?? null,
            created_at: r.created_at,
          };
        })
      );
      return json({ admins: enriched });
    }

    if (action === "grant" || action === "revoke") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) return json({ error: "E-mail inválido" }, 400);

      // Find user by email via admin listUsers (paginate up to a few pages)
      let targetUserId: string | null = null;
      for (let page = 1; page <= 10 && !targetUserId; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error) return json({ error: error.message }, 500);
        const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
        if (match) targetUserId = match.id;
        if (data.users.length < 200) break;
      }
      if (!targetUserId) return json({ error: "Usuário não encontrado com esse e-mail" }, 404);

      if (action === "grant") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "admin" });
        if (error && !error.message.includes("duplicate")) return json({ error: error.message }, 500);
        return json({ ok: true });
      } else {
        if (targetUserId === caller.id) {
          return json({ error: "Você não pode remover seu próprio acesso de admin" }, 400);
        }
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
