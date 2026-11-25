export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      daily_site_diaries: {
        Row: {
          created_at: string
          critical_delays: string | null
          ground_conditions: string | null
          id: string
          log_date: string
          max_temp_c: number | null
          min_temp_c: number | null
          overall_site_summary: string | null
          project_id: string
          signed_off: boolean
          site_agent_id: string | null
          weather_afternoon: string | null
          weather_morning: string | null
        }
        Insert: {
          created_at?: string
          critical_delays?: string | null
          ground_conditions?: string | null
          id?: string
          log_date?: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          overall_site_summary?: string | null
          project_id: string
          signed_off?: boolean
          site_agent_id?: string | null
          weather_afternoon?: string | null
          weather_morning?: string | null
        }
        Update: {
          created_at?: string
          critical_delays?: string | null
          ground_conditions?: string | null
          id?: string
          log_date?: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          overall_site_summary?: string | null
          project_id?: string
          signed_off?: boolean
          site_agent_id?: string | null
          weather_afternoon?: string | null
          weather_morning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_diaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daywork_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          labour_hours: number
          labour_rate: number
          materials_cost: number
          plant_cost: number
          project_id: string
          sheet_number: string
          signature_data_url: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          subcontractor_id: string | null
          updated_at: string
          variation_id: string | null
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          labour_hours?: number
          labour_rate?: number
          materials_cost?: number
          plant_cost?: number
          project_id: string
          sheet_number: string
          signature_data_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          variation_id?: string | null
          work_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          labour_hours?: number
          labour_rate?: number
          materials_cost?: number
          plant_cost?: number
          project_id?: string
          sheet_number?: string
          signature_data_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          variation_id?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daywork_sheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daywork_sheets_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      drawing_pins: {
        Row: {
          corrective_action: string | null
          created_at: string
          created_by: string | null
          drawing_id: string
          hazard_category: string | null
          id: string
          note: string | null
          photo_url: string | null
          pin_type: string
          reference_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_photo_url: string | null
          revision_id: string | null
          severity: string | null
          status: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          drawing_id: string
          hazard_category?: string | null
          id?: string
          note?: string | null
          photo_url?: string | null
          pin_type: string
          reference_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_photo_url?: string | null
          revision_id?: string | null
          severity?: string | null
          status?: string
          x_percent: number
          y_percent: number
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          drawing_id?: string
          hazard_category?: string | null
          id?: string
          note?: string | null
          photo_url?: string | null
          pin_type?: string
          reference_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_photo_url?: string | null
          revision_id?: string | null
          severity?: string | null
          status?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "drawing_pins_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawing_pins_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "drawing_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      drawing_revisions: {
        Row: {
          created_at: string
          date_issued: string | null
          drawing_id: string
          id: string
          issued_by: string | null
          reason_for_issue: string | null
          revision_code: string
          revision_file_url: string | null
        }
        Insert: {
          created_at?: string
          date_issued?: string | null
          drawing_id: string
          id?: string
          issued_by?: string | null
          reason_for_issue?: string | null
          revision_code: string
          revision_file_url?: string | null
        }
        Update: {
          created_at?: string
          date_issued?: string | null
          drawing_id?: string
          id?: string
          issued_by?: string | null
          reason_for_issue?: string | null
          revision_code?: string
          revision_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drawing_revisions_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          created_at: string
          created_by: string | null
          current_revision: string
          discipline: string
          drawing_url: string | null
          id: string
          level_code: string | null
          project_id: string
          sheet_number: string
          sheet_title: string
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_revision?: string
          discipline: string
          drawing_url?: string | null
          id?: string
          level_code?: string | null
          project_id: string
          sheet_number: string
          sheet_title: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_revision?: string
          discipline?: string
          drawing_url?: string | null
          id?: string
          level_code?: string | null
          project_id?: string
          sheet_number?: string
          sheet_title?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_lines: {
        Row: {
          budget: number
          committed: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          budget?: number
          committed?: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          project_id: string
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          budget?: number
          committed?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_work_quotes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          decided_note: string | null
          description: string
          id: string
          photo_url: string | null
          project_id: string
          quote_number: string
          status: string
          subcontractor_id: string
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          decided_note?: string | null
          description: string
          id?: string
          photo_url?: string | null
          project_id: string
          quote_number: string
          status?: string
          subcontractor_id: string
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          decided_note?: string | null
          description?: string
          id?: string
          photo_url?: string | null
          project_id?: string
          quote_number?: string
          status?: string
          subcontractor_id?: string
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_work_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_work_quotes_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_applications: {
        Row: {
          application_number: number
          approved_variations: number
          books_reference: string | null
          books_sync_status: string
          created_at: string
          gross_work_value: number
          id: string
          period_end: string
          platform_fee_bps: number
          platform_fixed_fee: number
          previous_certified: number
          project_id: string
          retention_percent: number
          status: string
          updated_at: string
        }
        Insert: {
          application_number: number
          approved_variations?: number
          books_reference?: string | null
          books_sync_status?: string
          created_at?: string
          gross_work_value?: number
          id?: string
          period_end: string
          platform_fee_bps?: number
          platform_fixed_fee?: number
          previous_certified?: number
          project_id: string
          retention_percent?: number
          status?: string
          updated_at?: string
        }
        Update: {
          application_number?: number
          approved_variations?: number
          books_reference?: string | null
          books_sync_status?: string
          created_at?: string
          gross_work_value?: number
          id?: string
          period_end?: string
          platform_fee_bps?: number
          platform_fixed_fee?: number
          previous_certified?: number
          project_id?: string
          retention_percent?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_addons: {
        Row: {
          activated_at: string | null
          active: boolean
          addon_key: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          active?: boolean
          addon_key: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          active?: boolean
          addon_key?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_addons_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          job_title: string | null
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          job_title?: string | null
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          job_title?: string | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      project_levels_zones: {
        Row: {
          created_at: string
          gridlines: string | null
          id: string
          level_code: string
          progress_percent: number | null
          project_id: string
          sequence_order: number
        }
        Insert: {
          created_at?: string
          gridlines?: string | null
          id?: string
          level_code: string
          progress_percent?: number | null
          project_id: string
          sequence_order?: number
        }
        Update: {
          created_at?: string
          gridlines?: string | null
          id?: string
          level_code?: string
          progress_percent?: number | null
          project_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_levels_zones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_approval_threshold: number
          created_at: string
          created_by: string | null
          currency: string
          default_retention_percent: number
          employer_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          original_contract_sum: number
          possession_date: string | null
          practical_completion_date: string | null
          programme_percent: number | null
          project_number: string
          revised_contract_sum: number | null
          site_address: string | null
          sponsor_sub_passes: boolean
          status: string
          updated_at: string
        }
        Insert: {
          client_approval_threshold?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          default_retention_percent?: number
          employer_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          original_contract_sum?: number
          possession_date?: string | null
          practical_completion_date?: string | null
          programme_percent?: number | null
          project_number: string
          revised_contract_sum?: number | null
          site_address?: string | null
          sponsor_sub_passes?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          client_approval_threshold?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          default_retention_percent?: number
          employer_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          original_contract_sum?: number
          possession_date?: string | null
          practical_completion_date?: string | null
          programme_percent?: number | null
          project_number?: string
          revised_contract_sum?: number | null
          site_address?: string | null
          sponsor_sub_passes?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      qa_test_results: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          test_code: string
          tested_at: string | null
          updated_at: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          test_code: string
          tested_at?: string | null
          updated_at?: string
          verdict?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          test_code?: string
          tested_at?: string | null
          updated_at?: string
          verdict?: string
        }
        Relationships: []
      }
      rfis: {
        Row: {
          assigned_consultant: string | null
          cost_impact: string | null
          created_at: string
          created_by: string | null
          date_raised: string
          date_required: string | null
          discipline: string | null
          drawing_id: string | null
          gridline_ref: string | null
          id: string
          level_zone_id: string | null
          official_response: string | null
          programme_impact_days: number | null
          project_id: string
          query_details: string | null
          response_date: string | null
          rfi_number: string
          status: string
          title: string
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          assigned_consultant?: string | null
          cost_impact?: string | null
          created_at?: string
          created_by?: string | null
          date_raised?: string
          date_required?: string | null
          discipline?: string | null
          drawing_id?: string | null
          gridline_ref?: string | null
          id?: string
          level_zone_id?: string | null
          official_response?: string | null
          programme_impact_days?: number | null
          project_id: string
          query_details?: string | null
          response_date?: string | null
          rfi_number: string
          status?: string
          title: string
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          assigned_consultant?: string | null
          cost_impact?: string | null
          created_at?: string
          created_by?: string | null
          date_raised?: string
          date_required?: string | null
          discipline?: string | null
          drawing_id?: string | null
          gridline_ref?: string | null
          id?: string
          level_zone_id?: string | null
          official_response?: string | null
          programme_impact_days?: number | null
          project_id?: string
          query_details?: string | null
          response_date?: string | null
          rfi_number?: string
          status?: string
          title?: string
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfis_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_level_zone_id_fkey"
            columns: ["level_zone_id"]
            isOneToOne: false
            referencedRelation: "project_levels_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_profiles: {
        Row: {
          company_name: string
          created_at: string
          email: string
          first_name: string
          job_role: string | null
          last_name: string
          organisation_type: string | null
          phone: string | null
          problems: string[]
          reason: string | null
          team_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          first_name: string
          job_role?: string | null
          last_name: string
          organisation_type?: string | null
          phone?: string | null
          problems?: string[]
          reason?: string | null
          team_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          job_role?: string | null
          last_name?: string
          organisation_type?: string | null
          phone?: string | null
          problems?: string[]
          reason?: string | null
          team_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_inspections: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inspected_at: string | null
          inspection_number: string
          inspector: string | null
          items: Json
          level_zone_id: string | null
          package_id: string | null
          project_id: string
          result: string
          template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspected_at?: string | null
          inspection_number: string
          inspector?: string | null
          items?: Json
          level_zone_id?: string | null
          package_id?: string | null
          project_id: string
          result?: string
          template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspected_at?: string | null
          inspection_number?: string
          inspector?: string | null
          items?: Json
          level_zone_id?: string | null
          package_id?: string | null
          project_id?: string
          result?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_inspections_level_zone_id_fkey"
            columns: ["level_zone_id"]
            isOneToOne: false
            referencedRelation: "project_levels_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_inspections_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "trade_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      snags: {
        Row: {
          created_at: string
          created_by: string | null
          defect_description: string
          drawing_id: string | null
          gridline_ref: string | null
          id: string
          level_zone_id: string | null
          package_id: string | null
          photo_defect_url: string | null
          photo_rectified_url: string | null
          project_id: string
          rectify_by_date: string | null
          severity: string
          snag_number: string
          status: string
          subcontractor_id: string | null
          updated_at: string
          x_percent: number | null
          y_percent: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          defect_description: string
          drawing_id?: string | null
          gridline_ref?: string | null
          id?: string
          level_zone_id?: string | null
          package_id?: string | null
          photo_defect_url?: string | null
          photo_rectified_url?: string | null
          project_id: string
          rectify_by_date?: string | null
          severity?: string
          snag_number: string
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          x_percent?: number | null
          y_percent?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          defect_description?: string
          drawing_id?: string | null
          gridline_ref?: string | null
          id?: string
          level_zone_id?: string | null
          package_id?: string | null
          photo_defect_url?: string | null
          photo_rectified_url?: string | null
          project_id?: string
          rectify_by_date?: string | null
          severity?: string
          snag_number?: string
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          x_percent?: number | null
          y_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "snags_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snags_level_zone_id_fkey"
            columns: ["level_zone_id"]
            isOneToOne: false
            referencedRelation: "project_levels_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snags_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "trade_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snags_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_claims: {
        Row: {
          books_sync_status: string
          certified_gross: number | null
          claim_number: number
          claimed_gross: number
          created_at: string
          created_by: string | null
          id: string
          period_end: string
          previous_certified: number
          project_id: string
          qs_notes: string | null
          retention_percent: number
          status: string
          subcontractor_id: string
          updated_at: string
        }
        Insert: {
          books_sync_status?: string
          certified_gross?: number | null
          claim_number: number
          claimed_gross?: number
          created_at?: string
          created_by?: string | null
          id?: string
          period_end: string
          previous_certified?: number
          project_id: string
          qs_notes?: string | null
          retention_percent?: number
          status?: string
          subcontractor_id: string
          updated_at?: string
        }
        Update: {
          books_sync_status?: string
          certified_gross?: number | null
          claim_number?: number
          claimed_gross?: number
          created_at?: string
          created_by?: string | null
          id?: string
          period_end?: string
          previous_certified?: number
          project_id?: string
          qs_notes?: string | null
          retention_percent?: number
          status?: string
          subcontractor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_claims_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_compliance: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          expiry_date: string | null
          id: string
          reference: string | null
          subcontractor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type: string
          expiry_date?: string | null
          id?: string
          reference?: string | null
          subcontractor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expiry_date?: string | null
          id?: string
          reference?: string | null
          subcontractor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_compliance_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_daily_returns: {
        Row: {
          created_at: string
          daily_site_diary_id: string | null
          delay_cause: string | null
          delay_encountered: boolean
          delay_hours: number | null
          id: string
          level_zone_id: string | null
          operative_count: number
          package_id: string | null
          plant_on_site: string | null
          subcontractor_id: string | null
          total_hours_worked: number
          work_carried_out: string | null
        }
        Insert: {
          created_at?: string
          daily_site_diary_id?: string | null
          delay_cause?: string | null
          delay_encountered?: boolean
          delay_hours?: number | null
          id?: string
          level_zone_id?: string | null
          operative_count?: number
          package_id?: string | null
          plant_on_site?: string | null
          subcontractor_id?: string | null
          total_hours_worked?: number
          work_carried_out?: string | null
        }
        Update: {
          created_at?: string
          daily_site_diary_id?: string | null
          delay_cause?: string | null
          delay_encountered?: boolean
          delay_hours?: number | null
          id?: string
          level_zone_id?: string | null
          operative_count?: number
          package_id?: string | null
          plant_on_site?: string | null
          subcontractor_id?: string | null
          total_hours_worked?: number
          work_carried_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_daily_returns_daily_site_diary_id_fkey"
            columns: ["daily_site_diary_id"]
            isOneToOne: false
            referencedRelation: "daily_site_diaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_daily_returns_level_zone_id_fkey"
            columns: ["level_zone_id"]
            isOneToOne: false
            referencedRelation: "project_levels_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_daily_returns_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "trade_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_daily_returns_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          company_name: string
          created_at: string
          email: string | null
          id: string
          package_id: string | null
          package_lead_name: string | null
          phone: string | null
          project_id: string
          status: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          package_id?: string | null
          package_lead_name?: string | null
          phone?: string | null
          project_id: string
          status?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          package_id?: string | null
          package_lead_name?: string | null
          phone?: string | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "trade_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          approver: string | null
          approver_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          package_id: string | null
          project_id: string
          spec_section: string | null
          status: string
          submittal_number: string
          submitted_by: string | null
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approver?: string | null
          approver_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          package_id?: string | null
          project_id: string
          spec_section?: string | null
          status?: string
          submittal_number: string
          submitted_by?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approver?: string | null
          approver_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          package_id?: string | null
          project_id?: string
          spec_section?: string | null
          status?: string
          submittal_number?: string
          submitted_by?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "trade_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          preferred: boolean
          rating: number
          trade: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          preferred?: boolean
          rating?: number
          trade: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          preferred?: boolean
          rating?: number
          trade?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_packages: {
        Row: {
          created_at: string
          id: string
          package_code: string
          package_name: string
          project_id: string
          subcontract_value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          package_code: string
          package_name: string
          project_id: string
          subcontract_value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          package_code?: string
          package_name?: string
          project_id?: string
          subcontract_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          approved_employer_amount: number | null
          claimed_contractor_amount: number | null
          created_at: string
          created_by: string | null
          eot_days_claimed: number | null
          eot_days_granted: number | null
          id: string
          instruction_source: string | null
          project_id: string
          scope_description: string | null
          source_id: string | null
          source_type: string | null
          status: string
          subcontractor_quotation: number | null
          title: string
          updated_at: string
          variation_number: string
        }
        Insert: {
          approved_employer_amount?: number | null
          claimed_contractor_amount?: number | null
          created_at?: string
          created_by?: string | null
          eot_days_claimed?: number | null
          eot_days_granted?: number | null
          id?: string
          instruction_source?: string | null
          project_id: string
          scope_description?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subcontractor_quotation?: number | null
          title: string
          updated_at?: string
          variation_number: string
        }
        Update: {
          approved_employer_amount?: number | null
          claimed_contractor_amount?: number | null
          created_at?: string
          created_by?: string | null
          eot_days_claimed?: number | null
          eot_days_granted?: number | null
          id?: string
          instruction_source?: string | null
          project_id?: string
          scope_description?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subcontractor_quotation?: number | null
          title?: string
          updated_at?: string
          variation_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_invites: { Args: never; Returns: number }
      is_project_manager: { Args: never; Returns: boolean }
      is_project_member: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
