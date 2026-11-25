ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_approval_threshold numeric NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS sponsor_sub_passes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_retention_percent numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "managers_create_projects" ON public.projects;
CREATE POLICY "managers_create_projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_project_manager());

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  trade text NOT NULL,
  contact_name text, phone text, email text,
  rating integer NOT NULL DEFAULT 3,
  preferred boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read" ON public.suppliers FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY "members_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_project_member());
CREATE POLICY "members_update" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_project_member()) WITH CHECK (public.is_project_member());
CREATE POLICY "creator_delete" ON public.suppliers FOR DELETE TO authenticated USING (public.is_project_member() AND created_by = auth.uid());
CREATE TRIGGER suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.extra_work_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  quote_number text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'Pending',
  decided_note text,
  variation_id uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extra_work_quotes TO authenticated;
GRANT ALL ON public.extra_work_quotes TO service_role;
ALTER TABLE public.extra_work_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read" ON public.extra_work_quotes FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY "members_insert" ON public.extra_work_quotes FOR INSERT TO authenticated WITH CHECK (public.is_project_member());
CREATE POLICY "members_update" ON public.extra_work_quotes FOR UPDATE TO authenticated USING (public.is_project_member()) WITH CHECK (public.is_project_member());
CREATE POLICY "creator_delete" ON public.extra_work_quotes FOR DELETE TO authenticated USING (public.is_project_member() AND created_by = auth.uid() AND status = 'Pending');
CREATE TRIGGER ewq_updated BEFORE UPDATE ON public.extra_work_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_quote_decision() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'Pending' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) AND NOT public.is_project_manager() THEN
    RAISE EXCEPTION 'Only project managers can approve or reject extra-work quotes';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ewq_manager_decision BEFORE INSERT OR UPDATE ON public.extra_work_quotes FOR EACH ROW EXECUTE FUNCTION public.enforce_quote_decision();

INSERT INTO public.suppliers (company_name, trade, contact_name, phone, email, rating, preferred) VALUES
 ('XYZ Apertures Ltd','Aluminium & Glazing','Mark Borg','+356 7900 1122','quotes@xyzapertures.mt',5,true),
 ('Malta Concrete Supplies','Concrete & Ready-mix','Joseph Vella','+356 2144 5566','orders@mcs.mt',4,true),
 ('Island MEP Services','Mechanical & Electrical','Sarah Camilleri','+356 9988 7766','tenders@islandmep.mt',4,true);