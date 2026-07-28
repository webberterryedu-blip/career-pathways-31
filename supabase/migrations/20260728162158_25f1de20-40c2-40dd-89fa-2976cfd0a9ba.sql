
-- 1. Fix view to security_invoker
ALTER VIEW public.vw_estudantes_grid SET (security_invoker = true);

-- 2. Revoke EXECUTE from public/anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. assignment_history: restrict to admin/instrutor
DROP POLICY IF EXISTS "Anyone can view assignment history" ON public.assignment_history;
DROP POLICY IF EXISTS "Authenticated users can delete assignment history" ON public.assignment_history;
DROP POLICY IF EXISTS "Authenticated users can insert assignment history" ON public.assignment_history;
DROP POLICY IF EXISTS "Authenticated users can update assignment history" ON public.assignment_history;

REVOKE ALL ON public.assignment_history FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_history TO authenticated;

CREATE POLICY "Staff can view assignment history" ON public.assignment_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff can insert assignment history" ON public.assignment_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff can update assignment history" ON public.assignment_history
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff can delete assignment history" ON public.assignment_history
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. designacoes: restrict writes to staff, reads to staff + assigned student
DROP POLICY IF EXISTS "Anyone can view assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON public.designacoes;

CREATE POLICY "View own or staff assignments" ON public.designacoes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'instrutor')
    OR estudante_id IN (SELECT id FROM public.estudantes WHERE user_id = auth.uid())
    OR ajudante_id IN (SELECT id FROM public.estudantes WHERE user_id = auth.uid())
  );
CREATE POLICY "Staff insert assignments" ON public.designacoes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update assignments" ON public.designacoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff delete assignments" ON public.designacoes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));

-- 5. estudantes: restrict reads and writes
DROP POLICY IF EXISTS "Anyone can view students" ON public.estudantes;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.estudantes;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.estudantes;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.estudantes;

CREATE POLICY "View own or staff students" ON public.estudantes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'instrutor')
    OR user_id = auth.uid()
  );
CREATE POLICY "Staff insert students" ON public.estudantes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update students" ON public.estudantes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff delete students" ON public.estudantes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. historico_designacoes: staff-only read
DROP POLICY IF EXISTS "Anyone can view assignment history" ON public.historico_designacoes;
CREATE POLICY "Staff view assignment change history" ON public.historico_designacoes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));

-- 7. partes: staff-only writes; reads stay authenticated
DROP POLICY IF EXISTS "Authenticated users can insert parts" ON public.partes;
DROP POLICY IF EXISTS "Authenticated users can update parts" ON public.partes;
CREATE POLICY "Staff insert parts" ON public.partes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update parts" ON public.partes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));

-- 8. programas: staff-only writes
DROP POLICY IF EXISTS "Authenticated users can insert programs" ON public.programas;
DROP POLICY IF EXISTS "Authenticated users can update programs" ON public.programas;
CREATE POLICY "Staff insert programs" ON public.programas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update programs" ON public.programas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));

-- 9. programas_ministeriais: staff-only writes, authenticated reads
DROP POLICY IF EXISTS "Anyone can view programs" ON public.programas_ministeriais;
DROP POLICY IF EXISTS "Authenticated users can delete programs" ON public.programas_ministeriais;
DROP POLICY IF EXISTS "Authenticated users can insert programs" ON public.programas_ministeriais;
DROP POLICY IF EXISTS "Authenticated users can update programs" ON public.programas_ministeriais;

REVOKE ALL ON public.programas_ministeriais FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programas_ministeriais TO authenticated;

CREATE POLICY "Authenticated view programs" ON public.programas_ministeriais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert programs" ON public.programas_ministeriais
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update programs" ON public.programas_ministeriais
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff delete programs" ON public.programas_ministeriais
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. programas_oficiais: public read (official schedule), staff-only writes
DROP POLICY IF EXISTS "Programas oficiais são visíveis para todos" ON public.programas_oficiais;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar programas" ON public.programas_oficiais;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar programas" ON public.programas_oficiais;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir programas" ON public.programas_oficiais;

GRANT SELECT ON public.programas_oficiais TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.programas_oficiais TO authenticated;

CREATE POLICY "Public view official programs" ON public.programas_oficiais
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff insert official programs" ON public.programas_oficiais
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff update official programs" ON public.programas_oficiais
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff delete official programs" ON public.programas_oficiais
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. sincronizacoes_jworg: staff-only
DROP POLICY IF EXISTS "Logs são visíveis para todos" ON public.sincronizacoes_jworg;
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.sincronizacoes_jworg;

REVOKE ALL ON public.sincronizacoes_jworg FROM anon;
GRANT SELECT, INSERT ON public.sincronizacoes_jworg TO authenticated;

CREATE POLICY "Staff view sync logs" ON public.sincronizacoes_jworg
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
CREATE POLICY "Staff insert sync logs" ON public.sincronizacoes_jworg
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instrutor'));
