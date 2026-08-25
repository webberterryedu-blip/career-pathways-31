import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEstudantes from "./tools/list-estudantes";
import listProgramas from "./tools/list-programas";
import listPartes from "./tools/list-partes";
import listDesignacoes from "./tools/list-designacoes";
import createDesignacao from "./tools/create-designacao";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "emt",
  title: "emt",
  version: "0.1.0",
  instructions:
    "Ferramentas do emt (Escola do Ministério Teocrático). Use `list_programas` para ver os programas semanais, `list_partes` para as partes de um programa, `list_estudantes` para os estudantes e suas qualificações, `list_designacoes` para consultar designações e `create_designacao` para designar um estudante a uma parte. Todas as operações respeitam as permissões do usuário conectado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProgramas, listPartes, listEstudantes, listDesignacoes, createDesignacao],
});
