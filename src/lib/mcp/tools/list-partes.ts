import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_partes",
  title: "Listar partes de um programa",
  description:
    "Lista as partes de um programa semanal (seção, ordem, título, duração e requisitos de gênero/privilégio).",
  inputSchema: {
    programa_id: z.string().uuid().describe("ID do programa semanal."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ programa_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("partes")
      .select(
        "id, programa_id, secao, ordem, titulo, duracao_min, requer_assistente, genero_requerido, requer_anciao, requer_servo_ministerial",
      )
      .eq("programa_id", programa_id)
      .order("ordem");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { partes: data ?? [] },
    };
  },
});
