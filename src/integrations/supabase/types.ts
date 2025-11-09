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
          assistente_id: string | null
          cancelado_em: string | null
          confirmado_em: string | null
          created_at: string
          data_designacao: string
          estudante_id: string
          id: string
          motivo_cancelamento: string | null
          observacoes: string | null
          parte_id: string
          status: Database["public"]["Enums"]["status_designacao"]
          updated_at: string
        }
        Insert: {
          assistente_id?: string | null
          cancelado_em?: string | null
          confirmado_em?: string | null
          created_at?: string
          data_designacao?: string
          estudante_id: string
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          parte_id: string
          status?: Database["public"]["Enums"]["status_designacao"]
          updated_at?: string
        }
        Update: {
          assistente_id?: string | null
          cancelado_em?: string | null
          confirmado_em?: string | null
          created_at?: string
          data_designacao?: string
          estudante_id?: string
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          parte_id?: string
          status?: Database["public"]["Enums"]["status_designacao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "designacoes_assistente_id_fkey"
            columns: ["assistente_id"]
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
            foreignKeyName: "designacoes_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: true
            referencedRelation: "partes"
            referencedColumns: ["id"]
          },
        ]
      }
      estudantes: {
        Row: {
          ativo: boolean
          chairman: boolean | null
          coabitacao: boolean | null
          created_at: string
          data_batismo: string | null
          data_nascimento: string | null
          email: string | null
          estado_civil: string | null
          explaining: boolean | null
          familia: string | null
          family_id: string | null
          following: boolean | null
          gems: boolean | null
          genero: Database["public"]["Enums"]["genero"]
          id: string
          id_conjuge: string | null
          id_mae: string | null
          id_pai: string | null
          idade: number | null
          making: boolean | null
          menor: boolean | null
          nome: string
          observacoes: string | null
          papel_familiar: string | null
          pray: boolean | null
          privilegio: Database["public"]["Enums"]["privilegio"]
          reading: boolean | null
          responsavel_primario: string | null
          responsavel_secundario: string | null
          sobrenome: string
          starting: boolean | null
          talk: boolean | null
          telefone: string | null
          treasures: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          chairman?: boolean | null
          coabitacao?: boolean | null
          created_at?: string
          data_batismo?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado_civil?: string | null
          explaining?: boolean | null
          familia?: string | null
          family_id?: string | null
          following?: boolean | null
          gems?: boolean | null
          genero: Database["public"]["Enums"]["genero"]
          id?: string
          id_conjuge?: string | null
          id_mae?: string | null
          id_pai?: string | null
          idade?: number | null
          making?: boolean | null
          menor?: boolean | null
          nome: string
          observacoes?: string | null
          papel_familiar?: string | null
          pray?: boolean | null
          privilegio?: Database["public"]["Enums"]["privilegio"]
          reading?: boolean | null
          responsavel_primario?: string | null
          responsavel_secundario?: string | null
          sobrenome: string
          starting?: boolean | null
          talk?: boolean | null
          telefone?: string | null
          treasures?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          chairman?: boolean | null
          coabitacao?: boolean | null
          created_at?: string
          data_batismo?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado_civil?: string | null
          explaining?: boolean | null
          familia?: string | null
          family_id?: string | null
          following?: boolean | null
          gems?: boolean | null
          genero?: Database["public"]["Enums"]["genero"]
          id?: string
          id_conjuge?: string | null
          id_mae?: string | null
          id_pai?: string | null
          idade?: number | null
          making?: boolean | null
          menor?: boolean | null
          nome?: string
          observacoes?: string | null
          papel_familiar?: string | null
          pray?: boolean | null
          privilegio?: Database["public"]["Enums"]["privilegio"]
          reading?: boolean | null
          responsavel_primario?: string | null
          responsavel_secundario?: string | null
          sobrenome?: string
          starting?: boolean | null
          talk?: boolean | null
          telefone?: string | null
          treasures?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      historico_designacoes: {
        Row: {
          acao: string
          alterado_por: string | null
          assistente_anterior_id: string | null
          assistente_novo_id: string | null
          created_at: string
          designacao_id: string
          estudante_anterior_id: string | null
          estudante_novo_id: string | null
          id: string
          motivo: string | null
        }
        Insert: {
          acao: string
          alterado_por?: string | null
          assistente_anterior_id?: string | null
          assistente_novo_id?: string | null
          created_at?: string
          designacao_id: string
          estudante_anterior_id?: string | null
          estudante_novo_id?: string | null
          id?: string
          motivo?: string | null
        }
        Update: {
          acao?: string
          alterado_por?: string | null
          assistente_anterior_id?: string | null
          assistente_novo_id?: string | null
          created_at?: string
          designacao_id?: string
          estudante_anterior_id?: string | null
          estudante_novo_id?: string | null
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_designacoes_assistente_anterior_id_fkey"
            columns: ["assistente_anterior_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_designacoes_assistente_novo_id_fkey"
            columns: ["assistente_novo_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_designacoes_designacao_id_fkey"
            columns: ["designacao_id"]
            isOneToOne: false
            referencedRelation: "designacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_designacoes_estudante_anterior_id_fkey"
            columns: ["estudante_anterior_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_designacoes_estudante_novo_id_fkey"
            columns: ["estudante_novo_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
        ]
      }
      partes: {
        Row: {
          created_at: string
          duracao_min: number
          genero_requerido: Database["public"]["Enums"]["genero"] | null
          id: string
          ordem: number
          programa_id: string
          requer_anciao: boolean
          requer_assistente: boolean
          requer_servo_ministerial: boolean
          secao: Database["public"]["Enums"]["secao_reuniao"]
          tipo_parte_id: string
          titulo: string
        }
        Insert: {
          created_at?: string
          duracao_min: number
          genero_requerido?: Database["public"]["Enums"]["genero"] | null
          id?: string
          ordem: number
          programa_id: string
          requer_anciao?: boolean
          requer_assistente?: boolean
          requer_servo_ministerial?: boolean
          secao: Database["public"]["Enums"]["secao_reuniao"]
          tipo_parte_id: string
          titulo: string
        }
        Update: {
          created_at?: string
          duracao_min?: number
          genero_requerido?: Database["public"]["Enums"]["genero"] | null
          id?: string
          ordem?: number
          programa_id?: string
          requer_anciao?: boolean
          requer_assistente?: boolean
          requer_servo_ministerial?: boolean
          secao?: Database["public"]["Enums"]["secao_reuniao"]
          tipo_parte_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "partes_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partes_tipo_parte_id_fkey"
            columns: ["tipo_parte_id"]
            isOneToOne: false
            referencedRelation: "tipos_parte"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          ativo: boolean
          created_at: string
          data_reuniao: string
          id: string
          id_semana: string
          leitura_biblia: string | null
          tema: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_reuniao: string
          id?: string
          id_semana: string
          leitura_biblia?: string | null
          tema: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_reuniao?: string
          id?: string
          id_semana?: string
          leitura_biblia?: string | null
          tema?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_parte: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          duracao_padrao_min: number
          genero_requerido: Database["public"]["Enums"]["genero"] | null
          id: string
          nome: string
          requer_anciao: boolean
          requer_assistente: boolean
          requer_servo_ministerial: boolean
          secao: Database["public"]["Enums"]["secao_reuniao"]
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          duracao_padrao_min: number
          genero_requerido?: Database["public"]["Enums"]["genero"] | null
          id?: string
          nome: string
          requer_anciao?: boolean
          requer_assistente?: boolean
          requer_servo_ministerial?: boolean
          secao: Database["public"]["Enums"]["secao_reuniao"]
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          duracao_padrao_min?: number
          genero_requerido?: Database["public"]["Enums"]["genero"] | null
          id?: string
          nome?: string
          requer_anciao?: boolean
          requer_assistente?: boolean
          requer_servo_ministerial?: boolean
          secao?: Database["public"]["Enums"]["secao_reuniao"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      genero: "masculino" | "feminino"
      privilegio: "anciao" | "servo_ministerial" | "publicador"
      secao_reuniao: "tesouros" | "ministerio" | "vida_crista"
      status_designacao: "designado" | "confirmado" | "cancelado"
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
      genero: ["masculino", "feminino"],
      privilegio: ["anciao", "servo_ministerial", "publicador"],
      secao_reuniao: ["tesouros", "ministerio", "vida_crista"],
      status_designacao: ["designado", "confirmado", "cancelado"],
    },
  },
} as const
