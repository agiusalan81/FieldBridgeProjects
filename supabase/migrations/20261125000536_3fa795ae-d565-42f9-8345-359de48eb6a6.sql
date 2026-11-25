CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt()->>'email','') = 'superadmin@fieldbridgeapp.com'
$$;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['drawing_pins','rfis','snags','variations','daywork_sheets','drawings'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid()', t);
    EXECUTE format('GRANT DELETE ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "creator_delete" ON public.%I', t);
    EXECUTE format('CREATE POLICY "creator_delete" ON public.%I FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_superadmin())', t);
  END LOOP;
END $$;

ALTER TABLE public.drawing_pins
  ADD COLUMN IF NOT EXISTS hazard_category text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS corrective_action text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS resolved_photo_url text,
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

ALTER TABLE public.variations
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid;

ALTER TABLE public.daywork_sheets ADD COLUMN IF NOT EXISTS variation_id uuid;
ALTER TABLE public.rfis ADD COLUMN IF NOT EXISTS variation_id uuid;

CREATE TABLE public.submittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  submittal_number text NOT NULL,
  title text NOT NULL,
  spec_section text,
  package_id uuid REFERENCES public.trade_packages(id),
  submitted_by text,
  approver text,
  status text NOT NULL DEFAULT 'Submitted',
  approver_notes text,
  target_date date,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.site_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  inspection_number text NOT NULL,
  template text NOT NULL,
  level_zone_id uuid REFERENCES public.project_levels_zones(id),
  package_id uuid REFERENCES public.trade_packages(id),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  result text NOT NULL DEFAULT 'In Progress',
  inspector text,
  inspected_at date DEFAULT current_date,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.subcontractor_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  claim_number integer NOT NULL,
  period_end date NOT NULL,
  claimed_gross numeric NOT NULL DEFAULT 0,
  retention_percent numeric NOT NULL DEFAULT 5,
  certified_gross numeric,
  previous_certified numeric NOT NULL DEFAULT 0,
  qs_notes text,
  status text NOT NULL DEFAULT 'Submitted',
  books_sync_status text NOT NULL DEFAULT 'Not sent',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.subcontractor_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  doc_type text NOT NULL,
  reference text,
  expiry_date date,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.qa_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code text NOT NULL UNIQUE,
  verdict text NOT NULL DEFAULT 'Pending',
  notes text,
  tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['submittals','site_inspections','subcontractor_claims','subcontractor_compliance'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "auth_read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "auth_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth_update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "creator_delete" ON public.%I FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_superadmin())', t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_test_results TO authenticated;
GRANT ALL ON public.qa_test_results TO service_role;
ALTER TABLE public.qa_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.qa_test_results FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE TRIGGER trg_qa_updated BEFORE UPDATE ON public.qa_test_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.submittals (project_id, submittal_number, title, spec_section, submitted_by, approver, status, target_date) VALUES
('00000000-0000-0000-0000-000000000001','SUB-001','Curtain wall system shop drawings','08 44 13','Façade subcontractor','Lead Architect','Submitted', current_date + 7),
('00000000-0000-0000-0000-000000000001','SUB-002','C40/50 concrete mix design','03 30 00','Frame contractor','Structural Engineer','Approved as Noted', current_date - 3);

INSERT INTO public.subcontractor_claims (project_id, subcontractor_id, claim_number, period_end, claimed_gross, previous_certified, status)
SELECT '00000000-0000-0000-0000-000000000001', id, 1, date_trunc('month', current_date)::date - 1, 185000, 0, 'Submitted' FROM public.subcontractors ORDER BY company_name LIMIT 2;

INSERT INTO public.subcontractor_compliance (subcontractor_id, doc_type, reference, expiry_date)
SELECT id, 'Public Liability Insurance', 'PL-'||left(id::text,6), current_date + 120 FROM public.subcontractors;
INSERT INTO public.subcontractor_compliance (subcontractor_id, doc_type, reference, expiry_date)
SELECT id, 'RAMS', 'RAMS-'||left(id::text,6), current_date - 5 FROM public.subcontractors ORDER BY company_name LIMIT 1;