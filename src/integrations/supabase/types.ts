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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      communication_logs: {
        Row: {
          communication_type: string
          fdp_event_id: string | null
          id: string
          message: string
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          communication_type: string
          fdp_event_id?: string | null
          id?: string
          message: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          communication_type?: string
          fdp_event_id?: string | null
          id?: string
          message?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_fdp_event_id_fkey"
            columns: ["fdp_event_id"]
            isOneToOne: false
            referencedRelation: "fdp_events"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_registrations: {
        Row: {
          attendance_marked: boolean | null
          certificate_issued: boolean | null
          certificate_url: string | null
          created_at: string | null
          department: string
          designation: string
          email: string
          fdp_event_id: string
          feedback_submitted: boolean | null
          host_college_id: string | null
          id: string
          institution: string
          name: string
          payment_id: string | null
          phone: string
          registration_status:
            | Database["public"]["Enums"]["registration_status"]
            | null
          registration_type: Database["public"]["Enums"]["registration_type"]
          updated_at: string | null
        }
        Insert: {
          attendance_marked?: boolean | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          created_at?: string | null
          department: string
          designation: string
          email: string
          fdp_event_id: string
          feedback_submitted?: boolean | null
          host_college_id?: string | null
          id?: string
          institution: string
          name: string
          payment_id?: string | null
          phone: string
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          registration_type: Database["public"]["Enums"]["registration_type"]
          updated_at?: string | null
        }
        Update: {
          attendance_marked?: boolean | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          created_at?: string | null
          department?: string
          designation?: string
          email?: string
          fdp_event_id?: string
          feedback_submitted?: boolean | null
          host_college_id?: string | null
          id?: string
          institution?: string
          name?: string
          payment_id?: string | null
          phone?: string
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          registration_type?: Database["public"]["Enums"]["registration_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_registrations_fdp_event_id_fkey"
            columns: ["fdp_event_id"]
            isOneToOne: false
            referencedRelation: "fdp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_registrations_host_college_id_fkey"
            columns: ["host_college_id"]
            isOneToOne: false
            referencedRelation: "host_colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      fdp_events: {
        Row: {
          banner_url: string | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          end_date: string
          faculty_fee: number
          highlights: string[] | null
          host_fee: number
          id: string
          location: string
          max_participants: number | null
          registered_count: number | null
          start_date: string
          status: Database["public"]["Enums"]["fdp_status"] | null
          timing: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date: string
          faculty_fee: number
          highlights?: string[] | null
          host_fee: number
          id?: string
          location: string
          max_participants?: number | null
          registered_count?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["fdp_status"] | null
          timing?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          faculty_fee?: number
          highlights?: string[] | null
          host_fee?: number
          id?: string
          location?: string
          max_participants?: number | null
          registered_count?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["fdp_status"] | null
          timing?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          faculty_registration_id: string
          fdp_event_id: string
          feedback_data: Json | null
          id: string
          rating: number | null
          suggestions: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          faculty_registration_id: string
          fdp_event_id: string
          feedback_data?: Json | null
          id?: string
          rating?: number | null
          suggestions?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          faculty_registration_id?: string
          fdp_event_id?: string
          feedback_data?: Json | null
          id?: string
          rating?: number | null
          suggestions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_faculty_registration_id_fkey"
            columns: ["faculty_registration_id"]
            isOneToOne: false
            referencedRelation: "faculty_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_fdp_event_id_fkey"
            columns: ["fdp_event_id"]
            isOneToOne: false
            referencedRelation: "fdp_events"
            referencedColumns: ["id"]
          },
        ]
      }
      host_colleges: {
        Row: {
          address: string
          college_name: string
          contact_person: string
          created_at: string | null
          email: string
          fdp_event_id: string
          id: string
          logo_url: string | null
          payment_id: string | null
          phone: string
          registration_status:
            | Database["public"]["Enums"]["registration_status"]
            | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address: string
          college_name: string
          contact_person: string
          created_at?: string | null
          email: string
          fdp_event_id: string
          id?: string
          logo_url?: string | null
          payment_id?: string | null
          phone: string
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          college_name?: string
          contact_person?: string
          created_at?: string | null
          email?: string
          fdp_event_id?: string
          id?: string
          logo_url?: string | null
          payment_id?: string | null
          phone?: string
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_colleges_fdp_event_id_fkey"
            columns: ["fdp_event_id"]
            isOneToOne: false
            referencedRelation: "fdp_events"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          fdp_event_id: string
          id: string
          payment_data: Json | null
          payment_gateway: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          registration_id: string | null
          registration_type: Database["public"]["Enums"]["registration_type"]
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          fdp_event_id: string
          id?: string
          payment_data?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          registration_id?: string | null
          registration_type: Database["public"]["Enums"]["registration_type"]
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          fdp_event_id?: string
          id?: string
          payment_data?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          registration_id?: string | null
          registration_type?: Database["public"]["Enums"]["registration_type"]
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_fdp_event_id_fkey"
            columns: ["fdp_event_id"]
            isOneToOne: false
            referencedRelation: "fdp_events"
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
      fdp_status: "draft" | "published" | "ongoing" | "completed" | "cancelled"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      registration_status: "pending" | "confirmed" | "cancelled"
      registration_type: "host" | "faculty_individual" | "faculty_under_host"
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
      fdp_status: ["draft", "published", "ongoing", "completed", "cancelled"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      registration_status: ["pending", "confirmed", "cancelled"],
      registration_type: ["host", "faculty_individual", "faculty_under_host"],
    },
  },
} as const
