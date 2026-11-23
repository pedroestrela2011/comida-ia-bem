-- Trigger-only functions must not be callable as public RPC endpoints.
REVOKE ALL ON FUNCTION public.protect_profile_entitlements() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_health_data_consent() FROM PUBLIC, anon, authenticated;
