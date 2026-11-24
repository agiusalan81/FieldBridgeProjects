DO $$ DECLARE t text; p record; BEGIN
FOREACH t IN ARRAY ARRAY['projects','project_levels_zones','trade_packages','subcontractors','drawings','drawing_revisions','drawing_pins','daily_site_diaries','subcontractor_daily_returns','rfis','snags','variations','payment_applications','project_addons'] LOOP
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
  END LOOP;
  EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', t);
  EXECUTE format('CREATE POLICY "Signed-in read" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
  EXECUTE format('CREATE POLICY "Signed-in insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t);
  EXECUTE format('CREATE POLICY "Signed-in update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
END LOOP; END $$;

CREATE TABLE public.daywork_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  sheet_number text NOT NULL,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  subcontractor_id uuid REFERENCES public.subcontractors(id),
  description text NOT NULL,
  labour_hours numeric NOT NULL DEFAULT 0,
  labour_rate numeric NOT NULL DEFAULT 0,
  plant_cost numeric NOT NULL DEFAULT 0,
  materials_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Awaiting Signature',
  signed_by text,
  signature_data_url text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.daywork_sheets TO authenticated;
GRANT ALL ON public.daywork_sheets TO service_role;
ALTER TABLE public.daywork_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read" ON public.daywork_sheets FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in insert" ON public.daywork_sheets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in update" ON public.daywork_sheets FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER update_daywork_sheets_updated_at BEFORE UPDATE ON public.daywork_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.daywork_sheets (project_id, sheet_number, work_date, subcontractor_id, description, labour_hours, labour_rate, plant_cost, materials_cost)
SELECT '00000000-0000-0000-0000-000000000001', v.n, v.d::date, (SELECT id FROM public.subcontractors ORDER BY company_name LIMIT 1 OFFSET v.o), v.descr, v.h, v.r, v.pl, v.m
FROM (VALUES ('DW-001','2026-11-20',0,'Break out and re-pour slab edge at Level 2 grid C/4 after clash with riser',16,38,240,410),
             ('DW-002','2026-11-23',2,'Additional temporary propping to Level 3 transfer beam on Engineer instruction',24,35,520,180)) AS v(n,d,o,descr,h,r,pl,m);