import * as XLSX from "xlsx";

interface ExportableAssignment {
  studentName: string;
  assistantName?: string;
  partType: string;
  studyPoint?: string;
  timing?: number;
  status: string;
  weekDate: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
  designado: "Designada",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

function safeFilePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
}

/**
 * Gera e baixa um arquivo .xlsx com as designações da semana.
 * Colunas: Estudante, Ajudante, Parte, Tempo (min), Status, Semana.
 */
export function exportDesignacoesToExcel(
  assignments: ExportableAssignment[],
  weekLabel: string
): void {
  const rows = assignments.map((a) => ({
    Estudante: a.studentName || "—",
    Ajudante: a.assistantName || "",
    Parte: a.studyPoint || a.partType || "—",
    "Tempo (min)": a.timing && a.timing > 0 ? a.timing : "",
    Status: STATUS_LABELS[a.status] || a.status || "Pendente",
    Semana: a.weekDate || weekLabel,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ["Estudante", "Ajudante", "Parte", "Tempo (min)", "Status", "Semana"],
  });

  worksheet["!cols"] = [
    { wch: 28 }, // Estudante
    { wch: 28 }, // Ajudante
    { wch: 45 }, // Parte
    { wch: 12 }, // Tempo
    { wch: 14 }, // Status
    { wch: 22 }, // Semana
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Designações");

  const fileName = `designacoes-${safeFilePart(weekLabel) || "semana"}.xlsx`;
  XLSX.writeFile(workbook, fileName, { compression: true });
}
