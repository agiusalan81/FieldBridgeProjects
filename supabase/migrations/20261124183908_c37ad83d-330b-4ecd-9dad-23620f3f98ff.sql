CREATE TABLE public.project_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  addon_key text NOT NULL CHECK (addon_key IN ('books','mail')),
  active boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, addon_key)
);
GRANT SELECT, INSERT, UPDATE ON public.project_addons TO anon, authenticated;
GRANT ALL ON public.project_addons TO service_role;
ALTER TABLE public.project_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read addons" ON public.project_addons FOR SELECT USING (true);
CREATE POLICY "demo insert addons" ON public.project_addons FOR INSERT WITH CHECK (true);
CREATE POLICY "demo update addons" ON public.project_addons FOR UPDATE USING (true) WITH CHECK (true);
INSERT INTO public.project_addons (project_id, addon_key, active) VALUES
 ('00000000-0000-0000-0000-000000000001','books',false),
 ('00000000-0000-0000-0000-000000000001','mail',false);