## Problema

Os 400s no console vêm de **3 incompatibilidades entre o código e o schema real do banco**:

| # | Código pede | Banco tem | Onde |
|---|---|---|---|
| 1 | `profiles.user_id` | `profiles.id` (PK = auth.users.id) | `AuthContext.tsx` (4 lugares), `useProfileLoader.ts`, hooks/utils diversos |
| 2 | `profiles!left(id,nome,email,telefone,cargo,role)` em `estudantes` | `profiles` só tem `id, nome, email, role` (sem `telefone`, sem `cargo`) — e **não há FK** entre `estudantes` e `profiles` | `useEstudantes.ts` e similares |
| 3 | `designacoes.ajudante_id` | `designacoes.assistente_id` | `useDesignacoes`, `useDesignacoesPendentes`, `AssignmentContext`, `NotificationContext`, `analyticsEngine`, `assignmentCommunication`, `DesignacoesReais.tsx`, types gerados |

## Solução — alinhar o banco ao código (1 migration) + ajustes pontuais

Como o código adota amplamente os nomes `ajudante_id`, `telefone`, `cargo` e `profiles.user_id`, é mais barato **migrar o schema** do que reescrever dezenas de arquivos.

### 1. Migration SQL

```sql
-- designacoes: renomear assistente_id -> ajudante_id
ALTER TABLE public.designacoes RENAME COLUMN assistente_id TO ajudante_id;

-- profiles: adicionar colunas faltantes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS cargo text;

-- estudantes.user_id -> profiles.id  (cria FK nomeada para embed PostgREST)
ALTER TABLE public.estudantes
  ADD CONSTRAINT estudantes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

A relação `estudantes.user_id → profiles.id` permite o embed `profiles!left(...)`.

### 2. Ajuste de código mínimo

`profiles` é chaveada por `id` (= `auth.users.id`), mas o código filtra por `user_id`. Duas opções:

- **A (preferida):** trocar `.eq('user_id', userId)` por `.eq('id', userId)` em `AuthContext.tsx` (linhas 216, 340, 665, 780) e `useProfileLoader.ts`. ~6 edições, nenhum risco.
- B: adicionar coluna `user_id` em `profiles` espelhando `id`. Mais sujo, descartado.

Vou aplicar a opção A.

### 3. Regenerar types do Supabase

Após a migration, `src/integrations/supabase/types.ts` é regenerado automaticamente. Os arquivos manuais `types.d.ts`/`client.d.ts` que já usam `ajudante_id` permanecem corretos.

### 4. Validação

- Recarregar `/estudantes`, `/designacoes`, `/dashboard` e confirmar zero 400s no console.
- `select` direto via psql para garantir que o embed `estudantes?select=*,profiles!left(...)` responde 200.

## Fora de escopo

Não vou mexer em RLS, lógica de negócio, S-38, parsing de PDFs nem na landing page. Só alinhar schema ↔ código para parar os erros 400.
