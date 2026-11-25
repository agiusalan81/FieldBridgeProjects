CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND lower(email) = 'superadmin@fieldbridgeapp.com' AND email_confirmed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enroll_confirmed_account(account_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE account_email text; invitation record; changed integer := 0; added integer;
BEGIN
 SELECT lower(email) INTO account_email FROM auth.users WHERE id = account_id AND email_confirmed_at IS NOT NULL;
 IF account_email IS NULL THEN RETURN 0; END IF;
 IF account_email = 'superadmin@fieldbridgeapp.com' THEN
   INSERT INTO public.project_members(user_id,role) VALUES(account_id,'owner')
   ON CONFLICT (user_id) DO UPDATE SET role='owner' WHERE project_members.role <> 'owner';
   GET DIAGNOSTICS added = ROW_COUNT; changed := changed + added;
 END IF;
 FOR invitation IN SELECT * FROM public.project_invites WHERE lower(email)=account_email AND status='Pending' AND role IN ('member','manager') ORDER BY created_at,id FOR UPDATE LOOP
   INSERT INTO public.project_members(user_id,role) VALUES(account_id,invitation.role) ON CONFLICT(user_id) DO NOTHING;
   UPDATE public.project_invites SET status='Accepted',accepted_at=now() WHERE id=invitation.id;
   changed := changed + 1;
 END LOOP;
 RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_confirmed_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_confirmed_account(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_invites()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN 0; END IF;
 RETURN public.enroll_confirmed_account(auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.claim_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_invites() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enroll_on_confirmation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.email_confirmed_at IS NOT NULL THEN PERFORM public.enroll_confirmed_account(NEW.id); END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_on_confirmation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER fieldbridge_enroll_confirmed_account AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.enroll_on_confirmation();
DO $$ DECLARE account record; BEGIN
 FOR account IN SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LOOP
   PERFORM public.enroll_confirmed_account(account.id);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.is_project_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND (public.is_superadmin() OR EXISTS(SELECT 1 FROM public.project_members WHERE user_id=auth.uid()));
$$;
CREATE OR REPLACE FUNCTION public.is_project_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IS NOT NULL AND (public.is_superadmin() OR EXISTS(SELECT 1 FROM public.project_members WHERE user_id=auth.uid() AND role IN ('owner','manager')));
$$;
REVOKE ALL ON FUNCTION public.is_project_member(),public.is_project_manager() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_project_member(),public.is_project_manager() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.set_drawing_creator()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NOT NULL THEN NEW.created_by := auth.uid(); END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER fieldbridge_drawing_creator BEFORE INSERT ON public.drawings FOR EACH ROW EXECUTE FUNCTION public.set_drawing_creator();

INSERT INTO public.qa_test_results(test_code,verdict,notes) VALUES
 ('FBP-ACC-02','Pending','Confirmed owner enrollment repaired. Database regression checks run; signed-in drawing upload in the browser remains unverified because an external Supabase session cannot be supplied automatically.'),
 ('FBP-ACC-03','Pending','Uninvited sign-ups do not become managers or gain project access. Invitation and confirmation paths require signed-in browser verification.')
ON CONFLICT(test_code) DO UPDATE SET verdict=EXCLUDED.verdict,notes=EXCLUDED.notes,tested_at=NULL;

-- Regression checks use actual database identity/permission context, not a browser sign-in.
SET LOCAL ROLE authenticated;
DO $$
DECLARE owner_id uuid := '967d3bf4-e619-44e7-be03-93c2d6841d5b'; drawing_id uuid; creator uuid;
BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 IF NOT public.is_superadmin() OR NOT public.is_project_member() OR NOT public.is_project_manager() THEN RAISE EXCEPTION 'Confirmed platform owner must have membership and manager access'; END IF;
 IF public.claim_invites() <> 0 THEN RAISE EXCEPTION 'Enrollment must be idempotent'; END IF;
 -- Roll back only the temporary test drawing, while retaining the real repair.
 BEGIN
   INSERT INTO public.drawings(project_id,discipline,sheet_number,sheet_title,current_revision,status,created_by)
   VALUES('00000000-0000-0000-0000-000000000001','Architectural','QA-ACCESS-ROLLBACK','Temporary membership regression','P01','For Construction','00000000-0000-0000-0000-000000000099') RETURNING id INTO drawing_id;
   SELECT created_by INTO creator FROM public.drawings WHERE id=drawing_id;
   IF creator IS DISTINCT FROM owner_id THEN RAISE EXCEPTION 'Drawing creator must come from signed-in identity'; END IF;
   RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='rollback successful drawing test';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
 PERFORM set_config('request.jwt.claims','{"sub":"7aa58042-4b2d-40ca-8c55-528d419148cf","role":"authenticated","email":"superadmin@fieldbridgeapp.com"}',true);
 IF public.claim_invites() <> 0 OR public.is_superadmin() OR public.is_project_member() OR public.is_project_manager() THEN RAISE EXCEPTION 'Unconfirmed/uninvited account or forged email must not gain access'; END IF;
 BEGIN
   INSERT INTO public.drawings(project_id,discipline,sheet_number,sheet_title,current_revision,status)
   VALUES('00000000-0000-0000-0000-000000000001','Architectural','QA-DENIED','Must be denied','P01','For Construction');
   RAISE EXCEPTION 'Uninvited account must be denied a drawing insert';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 PERFORM set_config('request.jwt.claims','{}',true);
 IF public.is_project_member() OR public.is_project_manager() OR public.is_superadmin() OR public.claim_invites() <> 0 THEN RAISE EXCEPTION 'Missing identity must have no access'; END IF;
END $$;
RESET ROLE;