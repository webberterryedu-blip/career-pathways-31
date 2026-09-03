import { z } from "zod";

/**
 * Executa `schema.safeParse(data)` e mapeia os `ZodError.issues` para um
 * registro de erros por campo, preservando a mensagem específica de cada issue.
 *
 * A chave é o primeiro segmento de `issue.path` (o nome do campo de nível
 * superior), o que funciona para formulários planos como os de estudante e
 * designação. Quando o path está vazio (erro de formulário), usa `_form`.
 *
 * @returns `Record<string, string[]>` — campo -> lista de mensagens.
 */
export function getZodFieldErrors(
  schema: z.ZodSchema,
  data: unknown
): Record<string, string[]> {
  const result = schema.safeParse(data);
  if (result.success) return {};

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field =
      issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

/**
 * Igual a `getZodFieldErrors`, mas retorna `Record<string, string>` com as
 * mensagens de cada campo unidas por " · ". Útil para componentes que exibem
 * uma única linha de erro por campo.
 */
export function getZodFieldErrorStrings(
  schema: z.ZodSchema,
  data: unknown
): Record<string, string> {
  const map = getZodFieldErrors(schema, data);
  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(map)) {
    out[field] = messages.join(" · ");
  }
  return out;
}
