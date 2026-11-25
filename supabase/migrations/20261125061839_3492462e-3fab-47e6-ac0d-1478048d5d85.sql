CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own membership" ON public.project_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_superadmin());
INSERT INTO public.project_members (user_id, role) VALUES ('457c0821-0251-4c77-b768-c0ffd0f17ba9', 'owner') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_project_member() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_project_manager() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE user_id = auth.uid() AND role IN ('owner','manager'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_project_member() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_project_manager() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_project_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_manager() TO authenticated;

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','project_levels_zones','trade_packages','subcontractors','drawings','drawing_revisions','drawing_pins','daily_site_diaries','subcontractor_daily_returns','rfis','snags','variations','payment_applications','project_addons','daywork_sheets','submittals','site_inspections','subcontractor_claims','subcontractor_compliance'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "members_read" ON public.%I FOR SELECT TO authenticated USING (public.is_project_member())', t);
    EXECUTE format('CREATE POLICY "members_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_project_member())', t);
    EXECUTE format('CREATE POLICY "members_update" ON public.%I FOR UPDATE TO authenticated USING (public.is_project_member()) WITH CHECK (public.is_project_member())', t);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='created_by') THEN
      EXECUTE format('CREATE POLICY "creator_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_project_member() AND (created_by = auth.uid() OR public.is_superadmin()))', t);
    END IF;
  END LOOP;
END $$;

-- Manager-only sign-offs, enforced in the database.
CREATE OR REPLACE FUNCTION public.enforce_manager_signoff() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE needs boolean := false;
BEGIN
  IF auth.uid() IS NULL OR public.is_project_manager() THEN RETURN NEW; END IF;
  CASE TG_TABLE_NAME
    WHEN 'projects', 'payment_applications', 'project_addons', 'subcontractor_compliance' THEN needs := true;
    WHEN 'subcontractor_claims' THEN
      needs := NEW.status <> 'Submitted' OR NEW.certified_gross IS NOT NULL OR NEW.books_sync_status <> 'Not sent'
        OR (TG_OP = 'UPDATE' AND (NEW.claimed_gross IS DISTINCT FROM OLD.claimed_gross OR NEW.previous_certified IS DISTINCT FROM OLD.previous_certified OR NEW.retention_percent IS DISTINCT FROM OLD.retention_percent));
    WHEN 'variations' THEN
      needs := NEW.status IN ('Approved','Rejected') OR NEW.approved_employer_amount IS NOT NULL OR NEW.eot_days_granted IS NOT NULL;
    WHEN 'submittals' THEN needs := NEW.status <> 'Submitted';
    WHEN 'site_inspections' THEN
      needs := NEW.result <> 'In Progress' OR (TG_OP = 'UPDATE' AND NEW.items IS DISTINCT FROM OLD.items);
    WHEN 'drawing_pins' THEN needs := NEW.status = 'Resolved';
    WHEN 'daywork_sheets' THEN needs := NEW.status = 'Signed' OR NEW.signature_data_url IS NOT NULL;
    ELSE needs := false;
  END CASE;
  IF needs THEN RAISE EXCEPTION 'Only a project manager can approve or sign off this item' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['projects','payment_applications','project_addons','subcontractor_compliance','subcontractor_claims','variations','submittals','site_inspections','drawing_pins','daywork_sheets'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_signoff BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_manager_signoff()', t, t);
  END LOOP;
END $$;