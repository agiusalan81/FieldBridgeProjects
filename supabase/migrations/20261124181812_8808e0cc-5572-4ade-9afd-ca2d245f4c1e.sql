CREATE TABLE public.payment_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  application_number integer NOT NULL,
  period_end date NOT NULL,
  gross_work_value numeric NOT NULL DEFAULT 0,
  approved_variations numeric NOT NULL DEFAULT 0,
  retention_percent numeric NOT NULL DEFAULT 5,
  previous_certified numeric NOT NULL DEFAULT 0,
  platform_fee_bps numeric NOT NULL DEFAULT 7.5,
  platform_fixed_fee numeric NOT NULL DEFAULT 299,
  status text NOT NULL DEFAULT 'Draft',
  books_sync_status text NOT NULL DEFAULT 'Not sent',
  books_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payment_applications TO anon, authenticated;
GRANT ALL ON public.payment_applications TO service_role;
ALTER TABLE public.payment_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo read" ON public.payment_applications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo insert" ON public.payment_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo update" ON public.payment_applications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_payment_applications_updated_at BEFORE UPDATE ON public.payment_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.payment_applications (project_id, application_number, period_end, gross_work_value, approved_variations, retention_percent, previous_certified, status, books_sync_status, books_reference) VALUES
('00000000-0000-0000-0000-000000000001', 1, '2026-09-30', 1850000, 0, 5, 0, 'Certified', 'Synced', 'FB-INV-2026-0141'),
('00000000-0000-0000-0000-000000000001', 2, '2026-10-31', 3820000, 120000, 5, 1757500, 'Submitted', 'Not sent', NULL);