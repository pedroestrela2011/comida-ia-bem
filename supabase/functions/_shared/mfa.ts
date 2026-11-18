import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function isMfaSatisfied(token: string, userId: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("MFA enforcement is not configured");
  }

  const service = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: preference, error: preferenceError } = await service
    .from("user_mfa_enforcement")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (preferenceError) throw preferenceError;
  if (!preference) return true;

  const auth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: assurance, error: assuranceError } =
    await auth.auth.mfa.getAuthenticatorAssuranceLevel(token);

  return !assuranceError && assurance.currentLevel === "aal2";
}
