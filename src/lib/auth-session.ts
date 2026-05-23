import { supabase } from "@/integrations/supabase/client";

const STALE_AUTH_FRAGMENTS = [
  "user from sub claim in jwt does not exist",
  "invalid refresh token",
  "refresh token not found",
  "user_not_found",
];

export const isStaleAuthSessionError = (error: unknown) => {
  const maybeError = error as { message?: string; code?: string; name?: string } | null;
  const text = [maybeError?.message, maybeError?.code, maybeError?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return STALE_AUTH_FRAGMENTS.some((fragment) => text.includes(fragment));
};

export const clearLocalAuthSession = async () => {
  await supabase.auth.signOut({ scope: "local" });
};