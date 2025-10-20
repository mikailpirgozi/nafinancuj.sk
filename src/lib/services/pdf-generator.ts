/**
 * PDF Generator Service
 * 
 * Generates PDF documents from contract templates with variable replacement.
 * For production use with @react-pdf/renderer or similar.
 */

export interface GeneratePDFParams {
  templateContent: string;
  variables: Record<string, string | number | boolean>;
  title?: string;
  loanData?: {
    variableSymbol: string;
  };
}

/**
 * Generate PDF from template with variable replacement
 * Returns a Buffer suitable for Supabase upload
 */
export async function generatePDFBuffer(
  params: GeneratePDFParams
): Promise<Buffer> {
  let content = params.templateContent;

  // Replace all variables in template
  Object.entries(params.variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, String(value));
  });

  // Create a basic PDF structure (text-based)
  // In production, use @react-pdf/renderer for proper PDF generation
  const pdfContent = generateSimplePDF({
    title: params.title || "Zmluva o pôžičke",
    variableSymbol: params.loanData?.variableSymbol,
    content,
  });

  return Buffer.from(pdfContent, "utf-8");
}

interface SimplePDFParams {
  title: string;
  variableSymbol?: string;
  content: string;
}

/**
 * Generate a simple text-based PDF structure
 * In production, replace with proper PDF library
 */
function generateSimplePDF(params: SimplePDFParams): string {
  const { title, variableSymbol, content } = params;

  // Basic PDF structure (simplified)
  const lines = [
    `%PDF-1.4`,
    `1 0 obj`,
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `endobj`,
    `2 0 obj`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `endobj`,
    `3 0 obj`,
    `<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>`,
    `endobj`,
    `4 0 obj`,
    `<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>`,
    `endobj`,
    `5 0 obj`,
    `<< /Length ${content.length + 200} >>`,
    `stream`,
    `BT`,
    `/F1 18 Tf`,
    `50 750 Td`,
    `(${escapeString(title)}) Tj`,
    `0 -30 Td`,
    `/F1 12 Tf`,
    variableSymbol ? `(č. ${escapeString(variableSymbol)}) Tj` : ``,
    `0 -40 Td`,
    `/F1 10 Tf`,
    `(${escapeString(content)}) Tj`,
    `ET`,
    `endstream`,
    `endobj`,
    `xref`,
    `0 6`,
    `0000000000 65535 f`,
    `0000000009 00000 n`,
    `0000000058 00000 n`,
    `0000000115 00000 n`,
    `0000000206 00000 n`,
    `0000000306 00000 n`,
    `trailer`,
    `<< /Size 6 /Root 1 0 R >>`,
    `startxref`,
    `${content.length + 500}`,
    `%%EOF`,
  ];

  return lines.filter(line => line !== "").join("\n");
}

/**
 * Escape special characters for PDF
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, " ");
}

/**
 * Generate loan agreement PDF - main entry point
 */
export async function generateLoanAgreementPDF(
  params: GeneratePDFParams
): Promise<Buffer> {
  return generatePDFBuffer(params);
}
