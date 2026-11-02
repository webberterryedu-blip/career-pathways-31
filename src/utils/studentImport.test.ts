import { describe, it, expect, vi, beforeEach } from 'vitest';
const mock = vi.hoisted(() => ({ getSession: vi.fn(), insert: vi.fn(), select: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mock.getSession }, from: mock.from } }));
import { saveImportedStudents } from './studentImport';
const student = { nome: 'Estudante de Teste', familia: 'Teste', genero: 'feminino' as const, ativo: true, starting: true };
beforeEach(() => {
  vi.clearAllMocks();
  mock.getSession.mockResolvedValue({ data: { session: { user: { id: 'test' } } }, error: null });
  mock.from.mockReturnValue({ insert: mock.insert });
  mock.insert.mockReturnValue({ select: mock.select });
  mock.select.mockResolvedValue({ data: [{ id: 'saved' }], error: null });
});
describe('Gravação real da importação', () => {
  it('grava em estudantes e confirma a quantidade devolvida', async () => {
    expect(await saveImportedStudents([student])).toBe(1);
    expect(mock.from).toHaveBeenCalledWith('estudantes');
    expect(mock.insert).toHaveBeenCalledWith([expect.objectContaining({ nome: 'Estudante de Teste', starting: true, sobrenome: 'Teste', user_id: null, privilegio: 'estudante_novo' })]);
  });
  it('não anuncia sucesso quando a gravação é rejeitada', async () => {
    mock.select.mockResolvedValue({ data: null, error: { code: '42501' } });
    await expect(saveImportedStudents([student])).rejects.toThrow('permissão');
  });
  it('não envia uma lista vazia', async () => {
    await expect(saveImportedStudents([])).rejects.toThrow('Nenhum estudante');
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it('não grava sem sessão', async () => {
    mock.getSession.mockResolvedValue({ data: { session: null } });
    await expect(saveImportedStudents([student])).rejects.toThrow('Entre na sua conta');
    expect(mock.insert).not.toHaveBeenCalled();
  });
});