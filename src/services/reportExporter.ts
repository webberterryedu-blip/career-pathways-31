import { ParticipationMetrics, AssignmentDistributionMetrics } from './analyticsEngine';

export interface ExportData {
  participationData: ParticipationMetrics[];
  distributionData: AssignmentDistributionMetrics | null;
  frequencyData: any;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export class ReportExporter {
  /**
   * Export report data to CSV format
   */
  static exportToCSV(data: ExportData): void {
    const { participationData, distributionData, dateRange } = data;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header information
    csvContent += "Relatório de Participação - Sistema Ministerial\n";
    if (dateRange) {
      csvContent += `Período: ${dateRange.startDate} a ${dateRange.endDate}\n`;
    }
    csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    // Add distribution summary
    if (distributionData) {
      csvContent += "RESUMO GERAL\n";
      csvContent += `Total de Estudantes,${distributionData.totalStudents}\n`;
      csvContent += `Estudantes Ativos,${distributionData.activeStudents}\n`;
      csvContent += `Média de Designações,${distributionData.averageAssignmentsPerStudent}\n`;
      csvContent += `Índice de Equilíbrio,${distributionData.assignmentDistributionBalance}\n`;
      csvContent += `Estudantes Subutilizados,${distributionData.underutilizedStudents.length}\n`;
      csvContent += `Estudantes Sobrecarregados,${distributionData.overutilizedStudents.length}\n\n`;
    }
    
    // Add participation details
    csvContent += "DETALHES DE PARTICIPAÇÃO\n";
    csvContent += "Nome,Total de Designações,Taxa de Participação (%),Pontuação de Habilidade,Última Designação,Tempo Médio Entre Designações (dias)\n";
    
    participationData.forEach(student => {
      csvContent += `${student.studentName},${student.totalAssignments},${student.participationRate},${student.skillDevelopmentScore},${student.lastAssignmentDate || 'N/A'},${student.averageTimeBetweenAssignments}\n`;
    });
    
    // Add assignment types breakdown
    csvContent += "\nDESIGNAÇÕES POR TIPO\n";
    csvContent += "Estudante,";
    
    // Get all unique assignment types
    const allTypes = new Set<string>();
    participationData.forEach(student => {
      Object.keys(student.assignmentsByType).forEach(type => allTypes.add(type));
    });
    
    const typeArray = Array.from(allTypes);
    csvContent += typeArray.join(',') + '\n';
    
    participationData.forEach(student => {
      csvContent += student.studentName + ',';
      csvContent += typeArray.map(type => student.assignmentsByType[type] || 0).join(',') + '\n';
    });
    
    // Create and download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_participacao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export report data to JSON format for further processing
   */
  static exportToJSON(data: ExportData): void {
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: data.dateRange,
        reportType: 'comprehensive'
      },
      summary: data.distributionData,
      participation: data.participationData,
      frequency: data.frequencyData
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `relatorio_dados_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate HTML report for printing or PDF conversion
   */
  static generateHTMLReport(data: ExportData): string {
    const { participationData, distributionData, dateRange } = data;
    
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Participação - Sistema Ministerial</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-item { background: white; padding: 10px; border-radius: 3px; }
            .summary-item h4 { margin: 0 0 5px 0; color: #333; }
            .summary-item .value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .summary-item .label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #333; }
            .alert { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Relatório de Participação</h1>
            <h2>Sistema de Gerenciamento Ministerial</h2>
            ${dateRange ? `<p>Período: ${dateRange.startDate} a ${dateRange.endDate}</p>` : ''}
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        ${distributionData ? `
        <div class="summary">
            <h3>Resumo Geral</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <h4>Total de Estudantes</h4>
                    <div class="value">${distributionData.totalStudents}</div>
                    <div class="label">${distributionData.activeStudents} ativos</div>
                </div>
                <div class="summary-item">
                    <h4>Média de Designações</h4>
                    <div class="value">${distributionData.averageAssignmentsPerStudent}</div>
                    <div class="label">por estudante</div>
                </div>
                <div class="summary-item">
                    <h4>Índice de Equilíbrio</h4>
                    <div class="value">${distributionData.assignmentDistributionBalance}</div>
                    <div class="label">${distributionData.assignmentDistributionBalance < 0.5 ? 'Excelente' : 
                                       distributionData.assignmentDistributionBalance < 1.0 ? 'Bom' : 'Precisa melhorar'}</div>
                </div>
                <div class="summary-item">
                    <h4>Alertas</h4>
                    <div class="value">${distributionData.underutilizedStudents.length + distributionData.overutilizedStudents.length}</div>
                    <div class="label">estudantes com desequilíbrio</div>
                </div>
            </div>
        </div>

        ${distributionData.underutilizedStudents.length > 0 ? `
        <div class="alert alert-warning">
            <strong>Estudantes Subutilizados:</strong> ${distributionData.underutilizedStudents.length} estudantes com poucas designações
        </div>
        ` : ''}

        ${distributionData.overutilizedStudents.length > 0 ? `
        <div class="alert alert-warning">
            <strong>Estudantes Sobrecarregados:</strong> ${distributionData.overutilizedStudents.length} estudantes com muitas designações
        </div>
        ` : ''}

        ${distributionData.underutilizedStudents.length === 0 && distributionData.overutilizedStudents.length === 0 ? `
        <div class="alert alert-success">
            <strong>Distribuição Equilibrada!</strong> Todos os estudantes têm uma carga adequada de designações.
        </div>
        ` : ''}
        ` : ''}

        <div class="section-title">Detalhes de Participação</div>
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Total de Designações</th>
                    <th>Taxa de Participação (%)</th>
                    <th>Pontuação de Habilidade</th>
                    <th>Última Designação</th>
                    <th>Tempo Médio Entre Designações (dias)</th>
                </tr>
            </thead>
            <tbody>
                ${participationData.map(student => `
                <tr>
                    <td>${student.studentName}</td>
                    <td>${student.totalAssignments}</td>
                    <td>${student.participationRate}%</td>
                    <td>${student.skillDevelopmentScore}</td>
                    <td>${student.lastAssignmentDate || 'N/A'}</td>
                    <td>${student.averageTimeBetweenAssignments}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="section-title">Designações por Tipo</div>
        <table>
            <thead>
                <tr>
                    <th>Estudante</th>
                    ${Array.from(new Set(participationData.flatMap(s => Object.keys(s.assignmentsByType)))).map(type => 
                        `<th>${type.replace('_', ' ').toUpperCase()}</th>`
                    ).join('')}
                </tr>
            </thead>
            <tbody>
                ${participationData.map(student => {
                    const allTypes = Array.from(new Set(participationData.flatMap(s => Object.keys(s.assignmentsByType))));
                    return `
                    <tr>
                        <td>${student.studentName}</td>
                        ${allTypes.map(type => `<td>${student.assignmentsByType[type] || 0}</td>`).join('')}
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </body>
    </html>
    `;
  }

  /**
   * Print HTML report
   */
  static printReport(data: ExportData): void {
    const htmlContent = this.generateHTMLReport(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  /**
   * Save HTML report as file for PDF conversion
   */
  static saveHTMLReport(data: ExportData): void {
    const htmlContent = this.generateHTMLReport(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_participacao_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export default ReportExporter;