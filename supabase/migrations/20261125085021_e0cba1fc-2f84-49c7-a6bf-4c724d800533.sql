CREATE SCHEMA IF NOT EXISTS fieldbridge_private;
REVOKE ALL ON SCHEMA fieldbridge_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA fieldbridge_private TO authenticated,service_role;
CREATE OR REPLACE FUNCTION fieldbridge_private.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND lower(email)='superadmin@fieldbridgeapp.com' AND email_confirmed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION fieldbridge_private.is_platform_owner() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION fieldbridge_private.is_platform_owner() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT fieldbridge_private.is_platform_owner();
$$;
REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated,service_role;