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
      designacoes: {
        Row: {
          ajudante_id: string | null
          cena: string | null
          created_at: string
          data_designacao: string | null
          estudante_id: string | null
          id: string
          observacoes: string | null
          parte_id: string | null
          programa_id: string | null
          status: string | null
          tempo_minutos: number | null
          titulo_parte: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ajudante_id?: string | null
          cena?: string | null
          created_at?: string
          data_designacao?: string | null
          estudante_id?: string | null
          id?: string
          observacoes?: string | null
          parte_id?: string | null
          programa_id?: string | null
          status?: string | null
          tempo_minutos?: number | null
          titulo_parte?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ajudante_id?: string | null
          cena?: string | null
          created_at?: string
          data_designacao?: string | null
          estudante_id?: string | null
          id?: string
          observacoes?: string | null
          parte_id?: string | null
          programa_id?: string | null
          status?: string | null
          tempo_minutos?: number | null
          titulo_parte?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designacoes_ajudante_id_fkey"
            columns: ["ajudante_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_estudante_id_fkey"
            columns: ["estudante_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designacoes_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas_ministeriais"
            referencedColumns: ["id"]
          },
        ]
      }
      estudantes: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          contador_designacoes: number | null
          created_at: string
          data_nascimento: string | null
          disponibilidade: Json | null
          familia_id: string | null
          genero: string | null
          id: string
          menor: boolean | null
          nome: string
          profile_id: string | null
          qualificacoes: Json | null
          responsavel_primario: string | null
          responsavel_secundario: string | null
          ultima_designacao: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          contador_designacoes?: number | null
          created_at?: string
          data_nascimento?: string | null
          disponibilidade?: Json | null
          familia_id?: string | null
          genero?: string | null
          id?: string
          menor?: boolean | null
          nome: string
          profile_id?: string | null
          qualificacoes?: Json | null
          responsavel_primario?: string | null
          responsavel_secundario?: string | null
          ultima_designacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          contador_designacoes?: number | null
          created_at?: string
          data_nascimento?: string | null
          disponibilidade?: Json | null
          familia_id?: string | null
          genero?: string | null
          id?: string
          menor?: boolean | null
          nome?: string
          profile_id?: string | null
          qualificacoes?: Json | null
          responsavel_primario?: string | null
          responsavel_secundario?: string | null
          ultima_designacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estudantes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partes_programa: {
        Row: {
          created_at: string
          duracao_minutos: number | null
          id: string
          ordem: number | null
          semana_id: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number | null
          semana_id?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number | null
          semana_id?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "partes_programa_semana_id_fkey"
            columns: ["semana_id"]
            isOneToOne: false
            referencedRelation: "semanas_programa"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          congregacao: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          congregacao?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          congregacao?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      programas_ministeriais: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string
          id: string
          mes_ano: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          id?: string
          mes_ano: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          id?: string
          mes_ano?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      semanas_programa: {
        Row: {
          created_at: string
          data_inicio: string | null
          id: string
          leitura_biblica: string | null
          programa_id: string | null
          semana_numero: number
          tema_semana: string | null
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          id?: string
          leitura_biblica?: string | null
          programa_id?: string | null
          semana_numero: number
          tema_semana?: string | null
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          id?: string
          leitura_biblica?: string | null
          programa_id?: string | null
          semana_numero?: number
          tema_semana?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "semanas_programa_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas_ministeriais"
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
      app_role: "admin" | "instrutor" | "estudante"
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
      app_role: ["admin", "instrutor", "estudante"],
    },
  },
} as const
