import { describe, it, expect } from 'vitest';
import { processRow, validateSpreadsheet, parseExcelFile } from './spreadsheetParser';
import * as XLSX from 'xlsx';

const student = { nome: 'Estudante de Teste', familia: 'Teste', idade: 26, genero: 'feminino', starting: true, following: 'true', making: 'VERDADEIRO', explaining: 1, talk: false, ativo: false };
describe('Importação de estudantes reais', () => {
  it('mantém estudantes válidos separados dos erros', () => {
    const result = validateSpreadsheet([student, { ...student, nome: '' }]);
    expect(result.validStudents).toHaveLength(1);
    expect(result.validStudents?.[0].nome).toBe('Estudante de Teste');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowIndex).toBe(3);
  });
  it('preserva qualificações e valores falsos', () => {
    const result = processRow(student, 2);
    expect(result.data).toMatchObject({ starting: true, following: true, making: true, explaining: true, talk: false, ativo: false });
  });
  it('preserva vínculos familiares sem criar contas a partir do Excel', () => {
    const id = '3795a9be-0f3c-4302-9add-913ad62b7747';
    expect(processRow({ ...student, family_id: id, id_mae: id, user_id: id }, 2).data).toMatchObject({ family_id: id, id_mae: id });
    expect(processRow({ ...student, user_id: id }, 2).data?.user_id).toBeUndefined();
  });
  it('reconhece cabeçalhos, gênero e datas reais do Excel', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ ' Nome ': 'Estudante de Teste', 'Família': 'Teste', 'GÊNERO': 'F', idade: 26, data_nascimento: new Date(2000, 7, 24), starting: true, reading: false }] ), 'Estudantes');
    const file = new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], 'estudantes.xlsx');
    const result = validateSpreadsheet(await parseExcelFile(file));
    expect(result.invalidRows).toBe(0);
    expect(result.validStudents?.[0]).toMatchObject({ data_nascimento: '2000-08-24', genero: 'feminino', starting: true, reading: false });
  });
  it('rejeita idades fracionárias e datas impossíveis', () => {
    expect(processRow({ ...student, idade: 26.5 }, 2).isValid).toBe(false);
    expect(processRow({ ...student, data_nascimento: '31/02/2000' }, 2).isValid).toBe(false);
  });
});