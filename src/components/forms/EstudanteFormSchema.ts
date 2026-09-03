import { z } from "zod";

const CARGOS = [
  "anciao",
  "servo_ministerial",
  "pioneiro_regular",
  "publicador_batizado",
  "publicador_nao_batizado",
  "estudante_novo",
] as const;

const GENEROS = ["masculino", "feminino"] as const;

const ESTADOS_CIVIS = [
  "desconhecido",
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
] as const;

const PAPEIS_FAMILIAR = [
  "",
  "pai",
  "mae",
  "filho",
  "conjuge",
  "outro",
] as const;

/** UUID válido ou string vazia (para campos opcionais de relacionamento). */
const optionalUuidOrEmpty = z
  .string()
  .uuid("ID inválido")
  .optional()
  .or(z.literal(""));

/** Data no formato YYYY-MM-DD ou string vazia. */
const optionalDateString = z
  .string()
  .optional()
  .refine(
    (val) => !val || !isNaN(new Date(val).getTime()),
    "Data inválida"
  );

/**
 * Schema Zod que espelha `EstudanteFormData` com mensagens em pt-BR.
 * Usado pelo `EstudanteForm` para exibir erros específicos por campo via
 * `error.issues`.
 */
export const estudanteFormSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  idade: z
    .number({ error: "Idade é obrigatória" })
    .int("Idade deve ser um número inteiro")
    .min(1, "Idade deve ser no mínimo 1 ano")
    .max(120, "Idade deve ser no máximo 120 anos"),
  genero: z.enum(GENEROS, { error: "Gênero é obrigatório" }),
  email: z
    .string()
    .email("Email deve ter um formato válido")
    .optional()
    .or(z.literal("")),
  telefone: z
    .string()
    .regex(
      /^\+?[\d\s\-()]+$/,
      "Telefone deve conter apenas números, espaços, hífens, parênteses e +"
    )
    .min(8, "Telefone deve ter pelo menos 8 caracteres")
    .optional()
    .or(z.literal("")),
  data_batismo: optionalDateString,
  cargo: z.enum(CARGOS, { error: "Cargo é obrigatório" }),
  id_pai_mae: optionalUuidOrEmpty,
  ativo: z.boolean(),
  observacoes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional(),
  familia: z.string().max(100, "Família deve ter no máximo 100 caracteres"),
  data_nascimento: optionalDateString,
  estado_civil: z.enum(ESTADOS_CIVIS, { error: "Estado civil inválido" }),
  papel_familiar: z.enum(PAPEIS_FAMILIAR, { error: "Papel familiar inválido" }),
  id_pai: optionalUuidOrEmpty,
  id_mae: optionalUuidOrEmpty,
  id_conjuge: optionalUuidOrEmpty,
  coabitacao: z.boolean(),
  menor: z.boolean(),
  responsavel_primario: optionalUuidOrEmpty,
  responsavel_secundario: optionalUuidOrEmpty,
  chairman: z.boolean(),
  pray: z.boolean(),
  treasures: z.boolean(),
  gems: z.boolean(),
  reading: z.boolean(),
  starting: z.boolean(),
  following: z.boolean(),
  making: z.boolean(),
  explaining: z.boolean(),
  talk: z.boolean(),
}) satisfies z.ZodType<EstudanteFormData>;

export type EstudanteFormValues = z.infer<typeof estudanteFormSchema>;
