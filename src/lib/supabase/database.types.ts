export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          id: string
          name: string
          reg_no_pattern: string | null
          short_name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name: string
          reg_no_pattern?: string | null
          short_name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          reg_no_pattern?: string | null
          short_name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      idea_details: {
        Row: {
          details: string
          idea_id: string
          updated_at: string
        }
        Insert: {
          details?: string
          idea_id: string
          updated_at?: string
        }
        Update: {
          details?: string
          idea_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_details_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_plan_versions: {
        Row: {
          created_at: string
          details: string
          edited_by: string | null
          id: string
          idea_id: string
        }
        Insert: {
          created_at?: string
          details: string
          edited_by?: string | null
          id?: string
          idea_id: string
        }
        Update: {
          created_at?: string
          details?: string
          edited_by?: string | null
          id?: string
          idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_plan_versions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_plan_versions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          college_id: string
          created_at: string
          hours_per_week: number
          id: string
          owner_id: string
          reward: string | null
          skills_needed: string[]
          status: Database["public"]["Enums"]["idea_status"]
          summary: string
          team_size: number
          title: string
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          hours_per_week: number
          id?: string
          owner_id: string
          reward?: string | null
          skills_needed: string[]
          status?: Database["public"]["Enums"]["idea_status"]
          summary: string
          team_size: number
          title: string
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          hours_per_week?: number
          id?: string
          owner_id?: string
          reward?: string | null
          skills_needed?: string[]
          status?: Database["public"]["Enums"]["idea_status"]
          summary?: string
          team_size?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          profile_id: string
          read_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          profile_id: string
          read_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          college_id: string | null
          created_at: string
          department: string | null
          full_name: string
          github_id: number | null
          github_synced_at: string | null
          github_username: string | null
          id: string
          is_admin: boolean
          last_active_at: string
          mode: Database["public"]["Enums"]["user_mode"] | null
          portfolio_url: string | null
          updated_at: string
          username: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_until: string | null
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          college_id?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          github_id?: number | null
          github_synced_at?: string | null
          github_username?: string | null
          id: string
          is_admin?: boolean
          last_active_at?: string
          mode?: Database["public"]["Enums"]["user_mode"] | null
          portfolio_url?: string | null
          updated_at?: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_until?: string | null
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          college_id?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          github_id?: number | null
          github_synced_at?: string | null
          github_username?: string | null
          id?: string
          is_admin?: boolean
          last_active_at?: string
          mode?: Database["public"]["Enums"]["user_mode"] | null
          portfolio_url?: string | null
          updated_at?: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_until?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_idea_id: string | null
          target_profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_idea_id?: string | null
          target_profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_idea_id?: string | null
          target_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_idea_id_fkey"
            columns: ["target_idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repos: {
        Row: {
          created_at: string
          description: string | null
          frameworks: string[]
          github_id: number
          id: string
          is_fork: boolean
          languages: Json
          main_language: string | null
          name: string
          profile_id: string
          pushed_at: string | null
          stars: number
          topics: string[]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frameworks?: string[]
          github_id: number
          id?: string
          is_fork?: boolean
          languages?: Json
          main_language?: string | null
          name: string
          profile_id: string
          pushed_at?: string | null
          stars?: number
          topics?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frameworks?: string[]
          github_id?: number
          id?: string
          is_fork?: boolean
          languages?: Json
          main_language?: string | null
          name?: string
          profile_id?: string
          pushed_at?: string | null
          stars?: number
          topics?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "repos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          builder_agreed_at: string | null
          created_at: string
          id: string
          idea_id: string
          message: string | null
          profile_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          builder_agreed_at?: string | null
          created_at?: string
          id?: string
          idea_id: string
          message?: string | null
          profile_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          builder_agreed_at?: string | null
          created_at?: string
          id?: string
          idea_id?: string
          message?: string | null
          profile_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          evidence: string | null
          id: string
          last_pushed_at: string | null
          name: string
          profile_id: string
          repo_count: number
          score: number
          slug: string
          source: Database["public"]["Enums"]["skill_source"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence?: string | null
          id?: string
          last_pushed_at?: string | null
          name: string
          profile_id: string
          repo_count?: number
          score?: number
          slug: string
          source: Database["public"]["Enums"]["skill_source"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence?: string | null
          id?: string
          last_pushed_at?: string | null
          name?: string
          profile_id?: string
          repo_count?: number
          score?: number
          slug?: string
          source?: Database["public"]["Enums"]["skill_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verifications: {
        Row: {
          card_valid_until: string | null
          college_id: string
          created_at: string
          department: string
          full_name: string
          id: string
          id_card_path: string | null
          method: string
          profile_id: string
          reg_no: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          updated_at: string
          year: number
        }
        Insert: {
          card_valid_until?: string | null
          college_id: string
          created_at?: string
          department: string
          full_name: string
          id?: string
          id_card_path?: string | null
          method?: string
          profile_id: string
          reg_no: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          updated_at?: string
          year: number
        }
        Update: {
          card_valid_until?: string | null
          college_id?: string
          created_at?: string
          department?: string
          full_name?: string
          id?: string
          id_card_path?: string | null
          method?: string
          profile_id?: string
          reg_no?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_verifications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          idea_id: string
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["team_role"]
        }
        Insert: {
          idea_id: string
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["team_role"]
        }
        Update: {
          idea_id?: string
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["team_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_members_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_reviews: {
        Row: {
          admin_id: string
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          id: string
          profile_id: string
          reason: string | null
          verification_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          id?: string
          profile_id: string
          reason?: string | null
          verification_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          id?: string
          profile_id?: string
          reason?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_reviews_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "student_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_profile: { Args: { p_profile_id: string }; Returns: boolean }
      clear_id_card_path: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      idea_matches: {
        Args: { p_idea_id: string; p_limit?: number }
        Returns: {
          avatar_url: string
          department: string
          evidence: Json
          full_name: string
          last_active_at: string
          match_pct: number
          matched_count: number
          needed_count: number
          profile_id: string
          request_status: Database["public"]["Enums"]["request_status"]
          username: string
          year: number
        }[]
      }
      idea_team_counts: {
        Args: { p_idea_ids: string[] }
        Returns: {
          idea_id: string
          members: number
        }[]
      }
      ideas_for_me: {
        Args: { p_limit?: number }
        Returns: {
          idea_id: string
          match_pct: number
          matched_count: number
          needed_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_blocked_between: { Args: { a: string; b: string }; Returns: boolean }
      is_idea_owner: {
        Args: { p_idea_id: string; uid?: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_idea_id: string; uid?: string }
        Returns: boolean
      }
      is_verified: { Args: { uid?: string }; Returns: boolean }
      my_college: { Args: never; Returns: string }
      respond_to_request: {
        Args: { p_accept: boolean; p_agreed?: boolean; p_request_id: string }
        Returns: {
          builder_agreed_at: string | null
          created_at: string
          id: string
          idea_id: string
          message: string | null
          profile_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_verification: {
        Args: {
          p_decision: Database["public"]["Enums"]["review_decision"]
          p_reason?: string
          p_verification_id: string
        }
        Returns: {
          card_valid_until: string | null
          college_id: string
          created_at: string
          department: string
          full_name: string
          id: string
          id_card_path: string | null
          method: string
          profile_id: string
          reg_no: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          updated_at: string
          year: number
        }
        SetofOptions: {
          from: "*"
          to: "student_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      skill_catalog: {
        Args: never
        Returns: {
          name: string
          slug: string
          students: number
        }[]
      }
      skill_score: {
        Args: { p_last_push: string; p_repo_count: number; p_stars: number }
        Returns: number
      }
      slugify: { Args: { value: string }; Returns: string }
      sync_github_profile: {
        Args: {
          p_github_id: number
          p_github_username: string
          p_profile_id: string
          p_repos: Json
          p_skills: Json
        }
        Returns: number
      }
      withdraw_request: {
        Args: { p_request_id: string }
        Returns: {
          builder_agreed_at: string | null
          created_at: string
          id: string
          idea_id: string
          message: string | null
          profile_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      idea_status:
        | "open"
        | "team_formed"
        | "in_progress"
        | "completed"
        | "archived"
      report_status: "open" | "resolved" | "dismissed"
      request_status: "pending" | "accepted" | "declined" | "withdrawn"
      request_type: "invite" | "application"
      review_decision: "approved" | "rejected"
      skill_source: "github" | "self"
      team_role: "owner" | "member"
      user_mode: "owner" | "builder" | "both"
      verification_status: "unverified" | "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      idea_status: [
        "open",
        "team_formed",
        "in_progress",
        "completed",
        "archived",
      ],
      report_status: ["open", "resolved", "dismissed"],
      request_status: ["pending", "accepted", "declined", "withdrawn"],
      request_type: ["invite", "application"],
      review_decision: ["approved", "rejected"],
      skill_source: ["github", "self"],
      team_role: ["owner", "member"],
      user_mode: ["owner", "builder", "both"],
      verification_status: ["unverified", "pending", "approved", "rejected"],
    },
  },
} as const

