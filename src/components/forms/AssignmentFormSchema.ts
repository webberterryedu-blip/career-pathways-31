import { z } from "zod";

/**
 * Schema Zod para edição de designação (AssignmentEditModal).
 * Mensagens em pt-BR, mapeadas por campo via error.issues.
 */
export const assignmentEditSchema = z.object({
  titulo_parte: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  tempo_minutos: z
    .number({ error: "Tempo é obrigatório" })
    .int("Tempo deve ser um número inteiro")
    .min(1, "Tempo deve ser no mínimo 1 minuto")
    .max(60, "Tempo deve ser no máximo 60 minutos"),
  cena: z
    .string()
    .max(500, "Cenário deve ter no máximo 500 caracteres")
    .optional(),
  id_estudante: z
    .string()
    .uuid("Estudante inválido")
    .min(1, "Estudante é obrigatório"),
  id_ajudante: z
    .string()
    .uuid("Ajudante inválido")
    .optional()
    .or(z.literal("")),
});

export type AssignmentEditValues = z.infer<typeof assignmentEditSchema>;
