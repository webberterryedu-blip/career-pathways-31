import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_programas",
  title: "Listar programas semanais",
  description:
    "Lista os programas semanais da reunião Vida e Ministério (semana, data, tema e leitura da Bíblia).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(10),
    apenas_ativos: z.boolean().default(true),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, apenas_ativos }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("programas")
      .select("id, id_semana, data_reuniao, tema, leitura_biblia, ativo")
      .order("data_reuniao", { ascending: false })
      .limit(limit);
    if (apenas_ativos) query = query.eq("ativo", true);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { programas: data ?? [] },
    };
  },
});
