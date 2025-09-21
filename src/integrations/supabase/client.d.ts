import type { Database } from './types';
declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", "public", {
    Tables: {
        designacoes: {
            Row: {
                ajudante_id: string | null;
                cena: string | null;
                created_at: string;
                data_designacao: string | null;
                estudante_id: string | null;
                id: string;
                observacoes: string | null;
                parte_id: string | null;
                programa_id: string | null;
                status: string | null;
                tempo_minutos: number | null;
                titulo_parte: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                ajudante_id?: string | null;
                cena?: string | null;
                created_at?: string;
                data_designacao?: string | null;
                estudante_id?: string | null;
                id?: string;
                observacoes?: string | null;
                parte_id?: string | null;
                programa_id?: string | null;
                status?: string | null;
                tempo_minutos?: number | null;
                titulo_parte?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                ajudante_id?: string | null;
                cena?: string | null;
                created_at?: string;
                data_designacao?: string | null;
                estudante_id?: string | null;
                id?: string;
                observacoes?: string | null;
                parte_id?: string | null;
                programa_id?: string | null;
                status?: string | null;
                tempo_minutos?: number | null;
                titulo_parte?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "designacoes_ajudante_id_fkey";
                columns: ["ajudante_id"];
                isOneToOne: false;
                referencedRelation: "estudantes";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "designacoes_estudante_id_fkey";
                columns: ["estudante_id"];
                isOneToOne: false;
                referencedRelation: "estudantes";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "designacoes_programa_id_fkey";
                columns: ["programa_id"];
                isOneToOne: false;
                referencedRelation: "programas_ministeriais";
                referencedColumns: ["id"];
            }];
        };
        estudantes: {
            Row: {
                ativo: boolean | null;
                cargo: string | null;
                contador_designacoes: number | null;
                created_at: string;
                data_nascimento: string | null;
                disponibilidade: import("./types").Json | null;
                familia_id: string | null;
                genero: string | null;
                id: string;
                menor: boolean | null;
                nome: string;
                profile_id: string | null;
                qualificacoes: import("./types").Json | null;
                responsavel_primario: string | null;
                responsavel_secundario: string | null;
                ultima_designacao: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                ativo?: boolean | null;
                cargo?: string | null;
                contador_designacoes?: number | null;
                created_at?: string;
                data_nascimento?: string | null;
                disponibilidade?: import("./types").Json | null;
                familia_id?: string | null;
                genero?: string | null;
                id?: string;
                menor?: boolean | null;
                nome: string;
                profile_id?: string | null;
                qualificacoes?: import("./types").Json | null;
                responsavel_primario?: string | null;
                responsavel_secundario?: string | null;
                ultima_designacao?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                ativo?: boolean | null;
                cargo?: string | null;
                contador_designacoes?: number | null;
                created_at?: string;
                data_nascimento?: string | null;
                disponibilidade?: import("./types").Json | null;
                familia_id?: string | null;
                genero?: string | null;
                id?: string;
                menor?: boolean | null;
                nome?: string;
                profile_id?: string | null;
                qualificacoes?: import("./types").Json | null;
                responsavel_primario?: string | null;
                responsavel_secundario?: string | null;
                ultima_designacao?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "estudantes_profile_id_fkey";
                columns: ["profile_id"];
                isOneToOne: false;
                referencedRelation: "profiles";
                referencedColumns: ["id"];
            }];
        };
        family_members: {
            Row: {
                created_at: string;
                email: string | null;
                family_id: string | null;
                id: string;
                is_active: boolean | null;
                name: string;
                phone: string | null;
                relationship_type: string | null;
                student_id: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                created_at?: string;
                email?: string | null;
                family_id?: string | null;
                id?: string;
                is_active?: boolean | null;
                name: string;
                phone?: string | null;
                relationship_type?: string | null;
                student_id?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                created_at?: string;
                email?: string | null;
                family_id?: string | null;
                id?: string;
                is_active?: boolean | null;
                name?: string;
                phone?: string | null;
                relationship_type?: string | null;
                student_id?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [];
        };
        invitations_log: {
            Row: {
                created_at: string;
                family_member_id: string | null;
                id: string;
                invitation_type: string;
                responded_at: string | null;
                response_data: import("./types").Json | null;
                sent_at: string | null;
                status: string | null;
                student_id: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                created_at?: string;
                family_member_id?: string | null;
                id?: string;
                invitation_type: string;
                responded_at?: string | null;
                response_data?: import("./types").Json | null;
                sent_at?: string | null;
                status?: string | null;
                student_id?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                created_at?: string;
                family_member_id?: string | null;
                id?: string;
                invitation_type?: string;
                responded_at?: string | null;
                response_data?: import("./types").Json | null;
                sent_at?: string | null;
                status?: string | null;
                student_id?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [];
        };
        partes_programa: {
            Row: {
                created_at: string;
                duracao_minutos: number | null;
                genero_requerido: string | null;
                id: string;
                ordem: number | null;
                semana_id: string | null;
                tipo: string | null;
                tipo_designacao: string | null;
                titulo: string;
            };
            Insert: {
                created_at?: string;
                duracao_minutos?: number | null;
                genero_requerido?: string | null;
                id?: string;
                ordem?: number | null;
                semana_id?: string | null;
                tipo?: string | null;
                tipo_designacao?: string | null;
                titulo: string;
            };
            Update: {
                created_at?: string;
                duracao_minutos?: number | null;
                genero_requerido?: string | null;
                id?: string;
                ordem?: number | null;
                semana_id?: string | null;
                tipo?: string | null;
                tipo_designacao?: string | null;
                titulo?: string;
            };
            Relationships: [{
                foreignKeyName: "partes_programa_semana_id_fkey";
                columns: ["semana_id"];
                isOneToOne: false;
                referencedRelation: "semanas_programa";
                referencedColumns: ["id"];
            }];
        };
        profiles: {
            Row: {
                cargo: string | null;
                congregacao: string | null;
                created_at: string;
                data_nascimento: string | null;
                email: string | null;
                id: string;
                nome: string | null;
                role: Database["public"]["Enums"]["app_role"] | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                cargo?: string | null;
                congregacao?: string | null;
                created_at?: string;
                data_nascimento?: string | null;
                email?: string | null;
                id?: string;
                nome?: string | null;
                role?: Database["public"]["Enums"]["app_role"] | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                cargo?: string | null;
                congregacao?: string | null;
                created_at?: string;
                data_nascimento?: string | null;
                email?: string | null;
                id?: string;
                nome?: string | null;
                role?: Database["public"]["Enums"]["app_role"] | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [];
        };
        programas: {
            Row: {
                ativo: boolean | null;
                created_at: string;
                descricao: string | null;
                id: string;
                nome: string;
                tipo: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                ativo?: boolean | null;
                created_at?: string;
                descricao?: string | null;
                id?: string;
                nome: string;
                tipo?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                ativo?: boolean | null;
                created_at?: string;
                descricao?: string | null;
                id?: string;
                nome?: string;
                tipo?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [];
        };
        programas_ministeriais: {
            Row: {
                arquivo_nome: string | null;
                arquivo_url: string | null;
                created_at: string;
                id: string;
                mes_ano: string;
                status: string | null;
                updated_at: string;
                user_id: string | null;
            };
            Insert: {
                arquivo_nome?: string | null;
                arquivo_url?: string | null;
                created_at?: string;
                id?: string;
                mes_ano: string;
                status?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Update: {
                arquivo_nome?: string | null;
                arquivo_url?: string | null;
                created_at?: string;
                id?: string;
                mes_ano?: string;
                status?: string | null;
                updated_at?: string;
                user_id?: string | null;
            };
            Relationships: [];
        };
        semanas_programa: {
            Row: {
                created_at: string;
                data_inicio: string | null;
                id: string;
                leitura_biblica: string | null;
                programa_id: string | null;
                semana_numero: number;
                tema_semana: string | null;
            };
            Insert: {
                created_at?: string;
                data_inicio?: string | null;
                id?: string;
                leitura_biblica?: string | null;
                programa_id?: string | null;
                semana_numero: number;
                tema_semana?: string | null;
            };
            Update: {
                created_at?: string;
                data_inicio?: string | null;
                id?: string;
                leitura_biblica?: string | null;
                programa_id?: string | null;
                semana_numero?: number;
                tema_semana?: string | null;
            };
            Relationships: [{
                foreignKeyName: "semanas_programa_programa_id_fkey";
                columns: ["programa_id"];
                isOneToOne: false;
                referencedRelation: "programas_ministeriais";
                referencedColumns: ["id"];
            }];
        };
    };
    Views: { [_ in never]: never; };
    Functions: { [_ in never]: never; };
    Enums: {
        app_role: "admin" | "instrutor" | "estudante";
    };
    CompositeTypes: { [_ in never]: never; };
}, {
    PostgrestVersion: "13.0.5";
}>;
export { supabase };
export default supabase;
