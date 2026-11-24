
CREATE TABLE public.projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_number text NOT NULL, name text NOT NULL, employer_name text, site_address text, latitude numeric, longitude numeric, original_contract_sum numeric NOT NULL DEFAULT 0, revised_contract_sum numeric, currency text NOT NULL DEFAULT 'EUR', possession_date date, practical_completion_date date, programme_percent numeric DEFAULT 0, status text NOT NULL DEFAULT 'Active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.project_levels_zones (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, level_code text NOT NULL, gridlines text, sequence_order int NOT NULL DEFAULT 0, progress_percent numeric DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.trade_packages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, package_code text NOT NULL, package_name text NOT NULL, subcontract_value numeric DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.subcontractors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, company_name text NOT NULL, package_id uuid REFERENCES public.trade_packages(id) ON DELETE SET NULL, package_lead_name text, phone text, email text, status text NOT NULL DEFAULT 'mobilized', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.drawings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, discipline text NOT NULL, sheet_number text NOT NULL, sheet_title text NOT NULL, level_code text, current_revision text NOT NULL DEFAULT 'Rev A', status text NOT NULL DEFAULT 'For Construction', drawing_url text, thumbnail_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.drawing_revisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), drawing_id uuid NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE, revision_code text NOT NULL, date_issued date, issued_by text, reason_for_issue text, revision_file_url text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.drawing_pins (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), drawing_id uuid NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE, revision_id uuid REFERENCES public.drawing_revisions(id) ON DELETE SET NULL, pin_type text NOT NULL, x_percent numeric NOT NULL, y_percent numeric NOT NULL, reference_id text, note text, status text NOT NULL DEFAULT 'Open', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.daily_site_diaries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, log_date date NOT NULL DEFAULT current_date, weather_morning text, weather_afternoon text, min_temp_c numeric, max_temp_c numeric, ground_conditions text, site_agent_id text, overall_site_summary text, critical_delays text, signed_off boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.subcontractor_daily_returns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), daily_site_diary_id uuid REFERENCES public.daily_site_diaries(id) ON DELETE CASCADE, subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE CASCADE, package_id uuid REFERENCES public.trade_packages(id) ON DELETE SET NULL, level_zone_id uuid REFERENCES public.project_levels_zones(id) ON DELETE SET NULL, operative_count int NOT NULL DEFAULT 0, total_hours_worked numeric NOT NULL DEFAULT 0, plant_on_site text, work_carried_out text, delay_encountered boolean NOT NULL DEFAULT false, delay_hours numeric DEFAULT 0, delay_cause text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.rfis (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, rfi_number text NOT NULL, title text NOT NULL, query_details text, discipline text, level_zone_id uuid REFERENCES public.project_levels_zones(id) ON DELETE SET NULL, drawing_id uuid REFERENCES public.drawings(id) ON DELETE SET NULL, gridline_ref text, assigned_consultant text, programme_impact_days int DEFAULT 0, cost_impact text DEFAULT 'None', status text NOT NULL DEFAULT 'Open', official_response text, response_date date, date_raised date NOT NULL DEFAULT current_date, date_required date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.snags (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, snag_number text NOT NULL, level_zone_id uuid REFERENCES public.project_levels_zones(id) ON DELETE SET NULL, gridline_ref text, package_id uuid REFERENCES public.trade_packages(id) ON DELETE SET NULL, subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE SET NULL, drawing_id uuid REFERENCES public.drawings(id) ON DELETE SET NULL, x_percent numeric, y_percent numeric, defect_description text NOT NULL, severity text NOT NULL DEFAULT 'Minor Cosmetic', status text NOT NULL DEFAULT 'Open', photo_defect_url text, photo_rectified_url text, rectify_by_date date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.variations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, variation_number text NOT NULL, title text NOT NULL, instruction_source text, scope_description text, subcontractor_quotation numeric DEFAULT 0, claimed_contractor_amount numeric DEFAULT 0, approved_employer_amount numeric DEFAULT 0, eot_days_claimed int DEFAULT 0, eot_days_granted int DEFAULT 0, status text NOT NULL DEFAULT 'Draft', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['projects','project_levels_zones','trade_packages','subcontractors','drawings','drawing_revisions','drawing_pins','daily_site_diaries','subcontractor_daily_returns','rfis','snags','variations'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "Demo read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "Demo insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "Demo update" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
END LOOP; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_projects_upd BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_drawings_upd BEFORE UPDATE ON public.drawings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rfis_upd BEFORE UPDATE ON public.rfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_snags_upd BEFORE UPDATE ON public.snags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_var_upd BEFORE UPDATE ON public.variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED
INSERT INTO public.projects VALUES ('00000000-0000-0000-0000-000000000001','PRJ-2026-01','St. Michael''s Commercial Complex & Residences','St. Michael''s Development Holdings Ltd','Triq San Mikiel, Valletta Waterfront, Malta',35.8989,14.5146,24500000,24500000,'EUR','2025-09-01','2027-06-30',46,'Active',now(),now());

INSERT INTO public.project_levels_zones (id,project_id,level_code,gridlines,sequence_order,progress_percent) VALUES
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','B2 - Basement -2','Grids A1-D6',1,100),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','B1 - Basement -1','Grids A1-D6',2,92),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','L00 - Ground Concourse','Grids A1-F8',3,78),
('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','L01 - Podium Retail','Grids A1-F8',4,64),
('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','L02 - Office Floor','Grids A1-D6',5,51),
('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','L03 - Office Floor','Grids A1-D6',6,38),
('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','L04 - Tower Level 4','Grids B1-D5',7,22),
('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','RF - Roof Plant Room','Grids B2-C4',8,5);

INSERT INTO public.trade_packages (id,project_id,package_code,package_name,subcontract_value) VALUES
('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PKG-01','Substructure & Groundworks',2850000),
('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','PKG-03','Reinforced Concrete Frame',5400000),
('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','PKG-04','Structural Steelwork & Metal Decking',1650000),
('20000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','PKG-05','External Envelope & Facade',3900000),
('20000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','PKG-06','Roofing & Waterproofing',720000),
('20000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','PKG-07','Internal Partitions & Drylining',1380000),
('20000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','PKG-08','MEP Services',4750000),
('20000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','PKG-12','Lift Installation',980000);

INSERT INTO public.subcontractors (id,project_id,company_name,package_id,package_lead_name,phone,email,status) VALUES
('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Bonnici Bros Groundworks','20000000-0000-0000-0000-000000000001','Joseph Bonnici','+356 7900 1101','j.bonnici@bonnicibros.mt','completed'),
('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Formcrete Frame Ltd','20000000-0000-0000-0000-000000000003','Mark Galea','+356 7900 1103','m.galea@formcrete.mt','on-site'),
('30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Ironbridge Steel','20000000-0000-0000-0000-000000000004','Paul Hennessy','+356 7900 1104','p.hennessy@ironbridge.eu','on-site'),
('30000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','Clearline Facades','20000000-0000-0000-0000-000000000005','Elena Rossi','+356 7900 1105','e.rossi@clearline.eu','on-site'),
('30000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','Apex Roofing Systems','20000000-0000-0000-0000-000000000006','Kurt Zammit','+356 7900 1106','k.zammit@apexroof.mt','mobilized'),
('30000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Interior Linings Malta','20000000-0000-0000-0000-000000000007','Ryan Camilleri','+356 7900 1107','r.camilleri@ilm.mt','on-site'),
('30000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','Volta MEP Engineering','20000000-0000-0000-0000-000000000008','Daniel Farrugia','+356 7900 1108','d.farrugia@voltamep.mt','on-site'),
('30000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','Vertex Lifts Europe','20000000-0000-0000-0000-000000000012','Stefan Kral','+356 7900 1112','s.kral@vertexlifts.eu','mobilized');

INSERT INTO public.drawings (id,project_id,discipline,sheet_number,sheet_title,level_code,current_revision,status) VALUES
('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Architectural','A-GA-102','General Arrangement - Level 02','L02','Rev C','For Construction'),
('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Structural','S-GA-B01','Basement 01 Slab & Column Layout','B1','Rev B','For Construction'),
('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','MEP - Mechanical','M-DU-102','Ductwork Layout - Level 02','L02','Rev D','For Construction'),
('40000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Vertical Transport','VT-LS-001','Lift Shaft Sections - Cores 1 & 2','All','Rev A','For Information');

INSERT INTO public.drawing_revisions (drawing_id,revision_code,date_issued,issued_by,reason_for_issue) VALUES
('40000000-0000-0000-0000-000000000001','Rev A','2025-10-02','Studio Axis Architects','Tender issue'),
('40000000-0000-0000-0000-000000000001','Rev B','2026-03-14','Studio Axis Architects','Riser relocated to grid C3'),
('40000000-0000-0000-0000-000000000001','Rev C','2026-09-22','Studio Axis Architects','Revised partition layout per AI-07'),
('40000000-0000-0000-0000-000000000002','Rev A','2025-08-20','Grima Structural','Tender issue'),
('40000000-0000-0000-0000-000000000002','Rev B','2026-01-10','Grima Structural','Additional drop panels at grid B4'),
('40000000-0000-0000-0000-000000000003','Rev C','2026-07-01','Volta MEP Design','Coordination with structure'),
('40000000-0000-0000-0000-000000000003','Rev D','2026-10-05','Volta MEP Design','Smoke damper additions per AI-09'),
('40000000-0000-0000-0000-000000000004','Rev A','2026-02-18','Vertex Lifts Europe','For information');

INSERT INTO public.drawing_pins (drawing_id,pin_type,x_percent,y_percent,reference_id,note,status) VALUES
('40000000-0000-0000-0000-000000000001','snag',32,41,'SN-041','Plasterboard joint cracking at column C2','Open'),
('40000000-0000-0000-0000-000000000001','rfi',58,36,'RFI-021','Door D2.14 swing conflicts with riser','Open'),
('40000000-0000-0000-0000-000000000001','safety_hazard',74,68,NULL,'Unprotected slab edge at grid D5','Open'),
('40000000-0000-0000-0000-000000000003','snag',46,52,'SN-044','Duct hanger missing at grid B3','Open'),
('40000000-0000-0000-0000-000000000002','observation',22,30,NULL,'Water ingress at retaining wall joint','Open'),
('40000000-0000-0000-0000-000000000002','snag',61,72,'SN-038','Honeycombing on column B4 face','Open');

INSERT INTO public.daily_site_diaries (id,project_id,log_date,weather_morning,weather_afternoon,min_temp_c,max_temp_c,ground_conditions,site_agent_id,overall_site_summary,critical_delays,signed_off) VALUES
('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',current_date,'Rain (cleared 09:30)','Sunny intervals, light wind',12,19,'Wet but workable; laydown area B muddy','Chris Vella','Tower crane TC-1 active from 09:45. L04 slab pour preparation, L02 drylining and MEP first fix progressing.','Standing time on L03 due to crane hook availability (1.5h).',false);

INSERT INTO public.subcontractor_daily_returns (daily_site_diary_id,subcontractor_id,package_id,level_zone_id,operative_count,total_hours_worked,plant_on_site,work_carried_out,delay_encountered,delay_hours,delay_cause) VALUES
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000007',12,96,'Tower crane TC-1, 1x concrete pump','L04 deck formwork and rebar fixing grids B1-C3',true,1.5,'Standing time waiting for tower crane hook'),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000004',6,48,'1x 50T Mobile Crane, 1x MEWP','Curtain wall unit install east elevation L01',false,0,NULL),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000005',9,72,'2x Scissor Lifts','Studwork and boarding L02 grids A1-C4',false,0,NULL),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000006',11,88,'2x Scissor Lifts, pipe threading rig','Ductwork first fix L03 grids C1-D4',true,2,'Access restricted by ductwork clash at lift shaft (RFI-018)'),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000008',4,32,'Tower crane TC-1 (shared)','Roof plant steel frame erection',false,0,NULL);

INSERT INTO public.rfis (project_id,rfi_number,title,query_details,discipline,level_zone_id,drawing_id,gridline_ref,assigned_consultant,programme_impact_days,cost_impact,status,official_response,response_date,date_raised,date_required) VALUES
('00000000-0000-0000-0000-000000000001','RFI-018','MEP ductwork clash with lift shaft divider beam','Main supply duct (1200x500) clashes with lift shaft divider beam on L03. Please confirm reroute or beam penetration.','MEP - Mechanical','10000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000003','Grids C2-C3','Grima Structural / Volta MEP Design',5,'Potential Addition','Open',NULL,NULL,current_date-9,current_date-2),
('00000000-0000-0000-0000-000000000001','RFI-019','Facade bracket fixing into PT slab edge','Confirm safe drilling zones for facade brackets near post-tensioned tendons on L02 edge.','Structural','10000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000001','Grid D1-D6','Grima Structural',0,'None','Under Review',NULL,NULL,current_date-5,current_date+3),
('00000000-0000-0000-0000-000000000001','RFI-020','Basement waterproofing detail at sump','Membrane termination detail at sump pit B1 not shown on drawings.','Civil','10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','Grid B4','Grima Structural',2,'Pending Evaluation','Answered','Lap membrane 150mm over sump kicker and seal with hydrophilic strip. Refer SK-S-031.',current_date-1,current_date-12,current_date-4),
('00000000-0000-0000-0000-000000000001','RFI-021','Door D2.14 swing conflicts with riser','Door swing obstructs riser access panel on L02.','Architectural','10000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000001','Grid C3','Studio Axis Architects',0,'None','Open',NULL,NULL,current_date-2,current_date+5),
('00000000-0000-0000-0000-000000000001','RFI-022','Lift pit depth confirmation Core 2','Confirm required pit depth for 1600kg goods lift Core 2.','Vertical Transport','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','Grid B2','Vertex Lifts Europe',0,'None','Draft',NULL,NULL,current_date,current_date+10);

INSERT INTO public.snags (project_id,snag_number,level_zone_id,gridline_ref,package_id,subcontractor_id,drawing_id,x_percent,y_percent,defect_description,severity,status,photo_defect_url,rectify_by_date) VALUES
('00000000-0000-0000-0000-000000000001','SN-041','10000000-0000-0000-0000-000000000005','Grid C2','20000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000001',32,41,'Plasterboard joint cracking at column C2 interface','Minor Cosmetic','Open','https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',current_date+4),
('00000000-0000-0000-0000-000000000001','SN-042','10000000-0000-0000-0000-000000000005','Grid B1-B2','20000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000001',20,22,'Fire-rated partition missing head deflection track','Critical / Life Safety','Open','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',current_date+1),
('00000000-0000-0000-0000-000000000001','SN-044','10000000-0000-0000-0000-000000000005','Grid B3','20000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000003',46,52,'Duct hanger missing; duct sagging over corridor','Major Defect','Open','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',current_date+2),
('00000000-0000-0000-0000-000000000001','SN-045','10000000-0000-0000-0000-000000000006','Grid D3','20000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000008',NULL,NULL,NULL,'Cable tray not earthed / bonding missing','Major Defect','Fixed - Awaiting Re-inspection','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',current_date),
('00000000-0000-0000-0000-000000000001','SN-038','10000000-0000-0000-0000-000000000002','Grid B4','20000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000002',61,72,'Honeycombing on column B4 face','Major Defect','Verified & Closed','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',current_date-6);

INSERT INTO public.variations (project_id,variation_number,title,instruction_source,scope_description,subcontractor_quotation,claimed_contractor_amount,approved_employer_amount,eot_days_claimed,eot_days_granted,status) VALUES
('00000000-0000-0000-0000-000000000001','VO-001','Upgraded lobby stone flooring','Client Request','Replace porcelain with honed limestone in L00 concourse.',142000,168500,161000,0,0,'Approved'),
('00000000-0000-0000-0000-000000000001','VO-002','Additional smoke dampers on Level 04','Architect''s Instruction','AI-09: 14 additional motorised smoke dampers to L04 corridor ductwork.',38400,46200,0,4,0,'Submitted to PQS / Employer'),
('00000000-0000-0000-0000-000000000001','VO-003','Basement sump relocation','Site Instruction','SI-14: relocate sump pit B1 to grid B4 due to obstruction.',21500,26800,24900,2,1,'Approved');
