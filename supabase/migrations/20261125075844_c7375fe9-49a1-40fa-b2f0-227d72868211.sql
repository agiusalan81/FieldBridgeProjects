CREATE TABLE public.signup_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL, last_name text NOT NULL, company_name text NOT NULL,
  email text NOT NULL, phone text, organisation_type text, job_role text, team_size text,
  problems text[] NOT NULL DEFAULT '{}', reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.signup_profiles TO authenticated;
GRANT ALL ON public.signup_profiles TO service_role;
ALTER TABLE public.signup_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_or_owner_read ON public.signup_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_superadmin());
CREATE POLICY own_insert ON public.signup_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY own_update ON public.signup_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER signup_profiles_updated BEFORE UPDATE ON public.signup_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL, full_name text, role text NOT NULL DEFAULT 'member',
  job_title text, status text NOT NULL DEFAULT 'Pending',
  invited_by uuid DEFAULT auth.uid(), accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invites TO authenticated;
GRANT ALL ON public.project_invites TO service_role;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON public.project_invites FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY managers_insert ON public.project_invites FOR INSERT TO authenticated WITH CHECK (public.is_project_manager() AND role IN ('manager','member'));
CREATE POLICY managers_update ON public.project_invites FOR UPDATE TO authenticated USING (public.is_project_manager());
CREATE POLICY managers_delete ON public.project_invites FOR DELETE TO authenticated USING (public.is_project_manager());

CREATE OR REPLACE FUNCTION public.claim_invites() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text := lower(coalesce(auth.jwt()->>'email','')); n integer := 0; r record;
BEGIN
  IF auth.uid() IS NULL OR em = '' THEN RETURN 0; END IF;
  FOR r IN SELECT * FROM project_invites WHERE lower(email) = em AND status = 'Pending' LOOP
    IF NOT EXISTS (SELECT 1 FROM project_members WHERE user_id = auth.uid()) THEN
      INSERT INTO project_members(user_id, role) VALUES (auth.uid(), r.role);
    END IF;
    UPDATE project_invites SET status = 'Accepted', accepted_at = now() WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_invites() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_invites() TO authenticated;

CREATE TABLE public.estimate_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section text NOT NULL, description text NOT NULL,
  budget numeric NOT NULL DEFAULT 0, committed numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0, created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimate_lines TO authenticated;
GRANT ALL ON public.estimate_lines TO service_role;
ALTER TABLE public.estimate_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON public.estimate_lines FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY managers_insert ON public.estimate_lines FOR INSERT TO authenticated WITH CHECK (public.is_project_manager());
CREATE POLICY managers_update ON public.estimate_lines FOR UPDATE TO authenticated USING (public.is_project_manager());
CREATE POLICY managers_delete ON public.estimate_lines FOR DELETE TO authenticated USING (public.is_project_manager());
CREATE TRIGGER estimate_lines_updated BEFORE UPDATE ON public.estimate_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.estimate_lines(project_id, section, description, budget, committed, sort_order) VALUES
('00000000-0000-0000-0000-000000000001','Preliminaries','Site setup, hoarding & welfare',85000,82000,1),
('00000000-0000-0000-0000-000000000001','Substructure','Excavation & foundations',420000,445000,2),
('00000000-0000-0000-0000-000000000001','Superstructure','Concrete frame & slabs',1250000,1180000,3),
('00000000-0000-0000-0000-000000000001','Envelope','Aluminium apertures',500000,512000,4),
('00000000-0000-0000-0000-000000000001','MEP','Electrical & plumbing',640000,600000,5),
('00000000-0000-0000-0000-000000000001','Finishes','Floor & wall finishes',380000,0,6),
('00000000-0000-0000-0000-000000000001','Contingency','Client contingency',150000,0,7);