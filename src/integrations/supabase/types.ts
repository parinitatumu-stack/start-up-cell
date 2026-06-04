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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          created_at: string
          feedback: Json
          id: string
          overall_score: number | null
          scores: Json
          startup_id: string
        }
        Insert: {
          created_at?: string
          feedback: Json
          id?: string
          overall_score?: number | null
          scores: Json
          startup_id: string
        }
        Update: {
          created_at?: string
          feedback?: Json
          id?: string
          overall_score?: number | null
          scores?: Json
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_day_registrations: {
        Row: {
          created_at: string
          deck_url: string | null
          id: string
          pitch_title: string
          presenter_name: string | null
          slot: string | null
          startup_id: string
          status: string
        }
        Insert: {
          created_at?: string
          deck_url?: string | null
          id?: string
          pitch_title: string
          presenter_name?: string | null
          slot?: string | null
          startup_id: string
          status?: string
        }
        Update: {
          created_at?: string
          deck_url?: string | null
          id?: string
          pitch_title?: string
          presenter_name?: string | null
          slot?: string | null
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_day_registrations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      jury_members: {
        Row: {
          designation: string | null
          id: string
          name: string
        }
        Insert: {
          designation?: string | null
          id?: string
          name: string
        }
        Update: {
          designation?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      mentor_assignments: {
        Row: {
          assigned_at: string
          id: string
          mentor_id: string
          startup_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          mentor_id: string
          startup_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          mentor_id?: string
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_assignments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_assignments_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          bio: string | null
          designation: string | null
          domain: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          bio?: string | null
          designation?: string | null
          domain: string
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          bio?: string | null
          designation?: string | null
          domain?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed: boolean
          id: string
          name: string
          position: number
          startup_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          id?: string
          name: string
          position?: number
          startup_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          id?: string
          name?: string
          position?: number
          startup_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_submissions: {
        Row: {
          build_summary: string | null
          created_at: string
          demo_url: string | null
          id: string
          repo_url: string | null
          startup_id: string
          status: string
        }
        Insert: {
          build_summary?: string | null
          created_at?: string
          demo_url?: string | null
          id?: string
          repo_url?: string | null
          startup_id: string
          status?: string
        }
        Update: {
          build_summary?: string | null
          created_at?: string
          demo_url?: string | null
          id?: string
          repo_url?: string | null
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_submissions_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      proposals: {
        Row: {
          business_model: string | null
          comments: string | null
          created_at: string
          id: string
          problem_statement: string | null
          solution: string | null
          startup_id: string
          status: string
          target_audience: string | null
        }
        Insert: {
          business_model?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          problem_statement?: string | null
          solution?: string | null
          startup_id: string
          status?: string
          target_audience?: string | null
        }
        Update: {
          business_model?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          problem_statement?: string | null
          solution?: string | null
          startup_id?: string
          status?: string
          target_audience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          business_model: string | null
          created_at: string
          description: string | null
          domain: string
          expected_impact: string | null
          id: string
          innovation_description: string | null
          market_opportunity: string | null
          name: string
          problem_statement: string | null
          solution: string | null
          status: string
          target_audience: string | null
          user_id: string
          vision: string | null
        }
        Insert: {
          business_model?: string | null
          created_at?: string
          description?: string | null
          domain: string
          expected_impact?: string | null
          id?: string
          innovation_description?: string | null
          market_opportunity?: string | null
          name: string
          problem_statement?: string | null
          solution?: string | null
          status?: string
          target_audience?: string | null
          user_id: string
          vision?: string | null
        }
        Update: {
          business_model?: string | null
          created_at?: string
          description?: string | null
          domain?: string
          expected_impact?: string | null
          id?: string
          innovation_description?: string | null
          market_opportunity?: string | null
          name?: string
          problem_statement?: string | null
          solution?: string | null
          status?: string
          target_audience?: string | null
          user_id?: string
          vision?: string | null
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          achievement: string | null
          created_at: string
          description: string | null
          domain: string
          founder_name: string
          id: string
          startup_name: string
          year: number | null
        }
        Insert: {
          achievement?: string | null
          created_at?: string
          description?: string | null
          domain: string
          founder_name: string
          id?: string
          startup_name: string
          year?: number | null
        }
        Update: {
          achievement?: string | null
          created_at?: string
          description?: string | null
          domain?: string
          founder_name?: string
          id?: string
          startup_name?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
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
  public: {
    Enums: {
      app_role: ["student", "admin"],
    },
  },
} as const
