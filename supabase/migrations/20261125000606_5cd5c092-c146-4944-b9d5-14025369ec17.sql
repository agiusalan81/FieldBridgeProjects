CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT coalesce(auth.jwt()->>'email','') = 'superadmin@fieldbridgeapp.com'
$$;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;