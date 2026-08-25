import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_designacoes",
  title: "Listar designações",
  description:
    "Lista as designações registradas, com estudante, ajudante, status e a parte designada.",
  inputSchema: {
    programa_id: z
      .string()
      .uuid()
      .optional()
      .describe("Filtra designações pelas partes deste programa."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ programa_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let parteIds: string[] | undefined;
    if (programa_id) {
      const { data: partes, error: partesError } = await supabase
        .from("partes")
        .select("id")
        .eq("programa_id", programa_id);
      if (partesError) {
        return { content: [{ type: "text", text: partesError.message }], isError: true };
      }
      parteIds = (partes ?? []).map((p) => p.id as string);
      if (parteIds.length === 0) {
        return {
          content: [{ type: "text", text: "[]" }],
          structuredContent: { designacoes: [] },
        };
      }
    }

    let query = supabase
      .from("designacoes")
      .select(
        "id, parte_id, estudante_id, ajudante_id, status, data_designacao, observacoes, partes(titulo, secao, ordem, programa_id)",
      )
      .order("data_designacao", { ascending: false })
      .limit(limit);
    if (parteIds) query = query.in("parte_id", parteIds);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { designacoes: data ?? [] },
    };
  },
});
