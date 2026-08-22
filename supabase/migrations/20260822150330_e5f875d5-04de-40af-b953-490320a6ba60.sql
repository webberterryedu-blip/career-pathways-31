DROP POLICY IF EXISTS "Staff update students" ON public.estudantes;
CREATE POLICY "Staff update students"
ON public.estudantes
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instrutor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instrutor'::app_role));