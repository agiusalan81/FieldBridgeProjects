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
          work_date: string
        }
        Insert: {
          created_at?: string
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
          work_date?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          drawing_id: string
          id: string
          note: string | null
          pin_type: string
          reference_id: string | null
          revision_id: string | null
          status: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string
          drawing_id: string
          id?: string
          note?: string | null
          pin_type: string
          reference_id?: string | null
          revision_id?: string | null
          status?: string
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string
          drawing_id?: string
          id?: string
          note?: string | null
          pin_type?: string
          reference_id?: string | null
          revision_id?: string | null
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
      projects: {
        Row: {
          created_at: string
          currency: string
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
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
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
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
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
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rfis: {
        Row: {
          assigned_consultant: string | null
          cost_impact: string | null
          created_at: string
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
        }
        Insert: {
          assigned_consultant?: string | null
          cost_impact?: string | null
          created_at?: string
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
        }
        Update: {
          assigned_consultant?: string | null
          cost_impact?: string | null
          created_at?: string
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
      snags: {
        Row: {
          created_at: string
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
          eot_days_claimed: number | null
          eot_days_granted: number | null
          id: string
          instruction_source: string | null
          project_id: string
          scope_description: string | null
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
          eot_days_claimed?: number | null
          eot_days_granted?: number | null
          id?: string
          instruction_source?: string | null
          project_id: string
          scope_description?: string | null
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
          eot_days_claimed?: number | null
          eot_days_granted?: number | null
          id?: string
          instruction_source?: string | null
          project_id?: string
          scope_description?: string | null
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
      [_ in never]: never
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
