import { supabase } from '@/integrations/supabase/client';
import type { ProcessedStudentData } from '@/types/spreadsheet';

export async function saveImportedStudents(students: ProcessedStudentData[]) {
  if (students.length === 0) throw new Error('Nenhum estudante válido para importar');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new Error('Entre na sua conta antes de importar estudantes');
  const records = students.map(({ cargo, user_id: _userId, id: _id, id_pai_mae: _parent, ...student }) => ({
    ...student,
    sobrenome: student.familia,
    privilegio: cargo ?? 'estudante_novo' as const,
    user_id: null,
  }));
  // One transaction: a rejected row cannot leave a partially imported spreadsheet.
  const { data, error } = await supabase.from('estudantes').insert(records).select('id');
  if (error) throw new Error(error.code === '42501'
    ? 'Sua conta não tem permissão para importar estudantes. É necessário acesso de instrutor.'
    : `Não foi possível salvar a planilha: ${error.message}`);
  if (!data || data.length !== records.length) throw new Error('Não foi possível confirmar todos os estudantes salvos');
  return data.length;
}