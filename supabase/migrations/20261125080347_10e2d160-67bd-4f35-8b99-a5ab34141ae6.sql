CREATE TABLE public.signoff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24),'hex'),
  item_type text NOT NULL, item_id uuid NOT NULL,
  title text NOT NULL, summary text, amount numeric, photos jsonb NOT NULL DEFAULT '[]',
  signer_name text NOT NULL, signer_email text, signer_role text,
  status text NOT NULL DEFAULT 'Pending', decision_note text,
  signature_data_url text, signed_name text, signed_at timestamptz, signed_ip text, signed_user_agent text,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX signoff_requests_project_idx ON public.signoff_requests(project_id);
CREATE INDEX signoff_requests_item_idx ON public.signoff_requests(item_id);
GRANT SELECT, INSERT, DELETE ON public.signoff_requests TO authenticated;
GRANT ALL ON public.signoff_requests TO service_role;
ALTER TABLE public.signoff_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON public.signoff_requests FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY members_insert ON public.signoff_requests FOR INSERT TO authenticated WITH CHECK (public.is_project_member() AND status = 'Pending' AND signature_data_url IS NULL);
CREATE POLICY creator_delete ON public.signoff_requests FOR DELETE TO authenticated USING (created_by = auth.uid() AND status = 'Pending');

CREATE TABLE public.item_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_type text NOT NULL, item_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  author_id uuid NOT NULL DEFAULT auth.uid(), author_email text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX item_messages_item_idx ON public.item_messages(item_id, created_at);
CREATE INDEX item_messages_project_idx ON public.item_messages(project_id);
GRANT SELECT, INSERT, DELETE ON public.item_messages TO authenticated;
GRANT ALL ON public.item_messages TO service_role;
ALTER TABLE public.item_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON public.item_messages FOR SELECT TO authenticated USING (public.is_project_member());
CREATE POLICY members_insert ON public.item_messages FOR INSERT TO authenticated WITH CHECK (public.is_project_member() AND author_id = auth.uid());
CREATE POLICY author_delete ON public.item_messages FOR DELETE TO authenticated USING (author_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_messages;