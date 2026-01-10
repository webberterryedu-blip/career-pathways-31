/**
 * PDF Text Extractor
 * Usa PDF.js para extrair texto de arquivos PDF
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFExtractionResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extrai texto de um arquivo PDF
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const pageCount = pdf.numPages;
    const textParts: string[] = [];
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extrai e junta o texto mantendo quebras de linha
      let lastY: number | null = null;
      let pageText = '';
      
      for (const item of textContent.items) {
        if ('str' in item) {
          const currentY = 'transform' in item ? item.transform[5] : 0;
          
          // Adiciona quebra de linha se mudou de linha (diferença significativa em Y)
          if (lastY !== null && Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
          } else if (lastY !== null && pageText.length > 0 && !pageText.endsWith(' ')) {
            pageText += ' ';
          }
          
          pageText += item.str;
          lastY = currentY;
        }
      }
      
      textParts.push(pageText);
    }
    
    return {
      success: true,
      text: textParts.join('\n\n--- Página ---\n\n'),
      pageCount
    };
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF'
    };
  }
}

/**
 * Valida se o arquivo é um PDF válido
 */
export function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Limpa e normaliza o texto extraído do PDF
 */
export function normalizeExtractedText(text: string): string {
  return text
    // Remove múltiplos espaços
    .replace(/  +/g, ' ')
    // Normaliza quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços no início/fim das linhas
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove linhas que são apenas marcadores de página
    .replace(/^--- Página ---$/gm, '')
    .trim();
}
