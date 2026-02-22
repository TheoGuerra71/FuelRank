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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      complaints: {
        Row: {
          created_at: string
          description: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          proof_url: string
          refueling_date: string
          reported_by: string
          station_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          proof_url: string
          refueling_date: string
          reported_by: string
          station_id: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          proof_url?: string
          refueling_date?: string
          reported_by?: string
          station_id?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_price_history: {
        Row: {
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          price: number
          recorded_at: string
          station_id: string
        }
        Insert: {
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          price: number
          recorded_at?: string
          station_id: string
        }
        Update: {
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          price?: number
          recorded_at?: string
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_price_history_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_prices: {
        Row: {
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          price: number
          station_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          price: number
          station_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          price?: number
          station_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_prices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          display_name: string
          id: string
          influence_level: string
          phone: string | null
          points: number
          price_updates: number
          reviews_count: number
          total_refuels: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_level?: string
          phone?: string | null
          points?: number
          price_updates?: number
          reviews_count?: number
          total_refuels?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_level?: string
          phone?: string | null
          points?: number
          price_updates?: number
          reviews_count?: number
          total_refuels?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refueling_history: {
        Row: {
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          km: number | null
          liters: number
          price_per_liter: number
          refueling_date: string
          station_id: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          km?: number | null
          liters: number
          price_per_liter: number
          refueling_date?: string
          station_id: string
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          km?: number | null
          liters?: number
          price_per_liter?: number
          refueling_date?: string
          station_id?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refueling_history_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          is_verified: boolean
          proof_url: string
          rating: number
          station_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified?: boolean
          proof_url: string
          rating: number
          station_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified?: boolean
          proof_url?: string
          rating?: number
          station_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string
          brand: string
          cnpj: string | null
          complaints_count: number
          created_at: string
          created_by: string | null
          has_promotion: boolean
          id: string
          lat: number
          lng: number
          name: string
          photos: string[] | null
          promotion_text: string | null
          rating: number
          review_count: number
          seal: Database["public"]["Enums"]["seal_status"]
          updated_at: string
        }
        Insert: {
          address: string
          brand?: string
          cnpj?: string | null
          complaints_count?: number
          created_at?: string
          created_by?: string | null
          has_promotion?: boolean
          id?: string
          lat: number
          lng: number
          name: string
          photos?: string[] | null
          promotion_text?: string | null
          rating?: number
          review_count?: number
          seal?: Database["public"]["Enums"]["seal_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          brand?: string
          cnpj?: string | null
          complaints_count?: number
          created_at?: string
          created_by?: string | null
          has_promotion?: boolean
          id?: string
          lat?: number
          lng?: number
          name?: string
          photos?: string[] | null
          promotion_text?: string | null
          rating?: number
          review_count?: number
          seal?: Database["public"]["Enums"]["seal_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "moderator" | "user"
      complaint_status: "pending" | "under_review" | "resolved" | "dismissed"
      fuel_type:
        | "gasolina_comum"
        | "gasolina_aditivada"
        | "etanol"
        | "diesel"
        | "gnv"
      seal_status: "trusted" | "observation" | "complaints"
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
      app_role: ["admin", "moderator", "user"],
      complaint_status: ["pending", "under_review", "resolved", "dismissed"],
      fuel_type: [
        "gasolina_comum",
        "gasolina_aditivada",
        "etanol",
        "diesel",
        "gnv",
      ],
      seal_status: ["trusted", "observation", "complaints"],
    },
  },
} as const
