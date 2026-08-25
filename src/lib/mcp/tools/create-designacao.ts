import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_designacao",
  title: "Criar designação",
  description:
    "Designa um estudante (e opcionalmente um ajudante) para uma parte do programa semanal.",
  inputSchema: {
    parte_id: z.string().uuid().describe("ID da parte do programa."),
    estudante_id: z.string().uuid().describe("ID do estudante designado."),
    ajudante_id: z.string().uuid().optional().describe("ID do ajudante, quando a parte exigir."),
    data_designacao: z
      .string()
      .optional()
      .describe("Data/hora ISO da designação. Padrão: agora."),
    observacoes: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ parte_id, estudante_id, ajudante_id, data_designacao, observacoes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("designacoes")
      .insert({
        parte_id,
        estudante_id,
        ajudante_id: ajudante_id ?? null,
        data_designacao: data_designacao ?? new Date().toISOString(),
        observacoes: observacoes ?? null,
      })
      .select("id, parte_id, estudante_id, ajudante_id, status, data_designacao")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { designacao: data },
    };
  },
});
