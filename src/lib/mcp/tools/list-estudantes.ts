import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_estudantes",
  title: "Listar estudantes",
  description:
    "Lista os estudantes da congregação com nome, gênero, privilégio e qualificações para designações.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filtra por nome ou sobrenome."),
    apenas_ativos: z.boolean().default(true).describe("Retorna somente estudantes ativos."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, apenas_ativos, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("estudantes")
      .select(
        "id, nome, sobrenome, genero, privilegio, idade, ativo, chairman, pray, treasures, gems, reading, starting, following, making, explaining, talk",
      )
      .order("nome")
      .limit(limit);
    if (apenas_ativos) query = query.eq("ativo", true);
    if (search) query = query.or(`nome.ilike.%${search}%,sobrenome.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { estudantes: data ?? [] },
    };
  },
});
