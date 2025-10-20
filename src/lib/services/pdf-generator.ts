export interface GeneratePDFParams {
  templateContent: string;
  variables: Record<string, string | number | boolean>;
  loanData?: {
    variableSymbol: string;
  };
}

export async function generateLoanAgreementPDF(
  params: GeneratePDFParams
): Promise<Blob> {
  // Return empty PDF blob
  const pdfContent = `%PDF-1.4\n% Loan: ${params.loanData?.variableSymbol || "N/A"}\n%EOF`;
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  return blob;
}

export async function generatePDFBuffer(params: GeneratePDFParams): Promise<Buffer> {
  const blob = await generateLoanAgreementPDF(params);
  return Buffer.from(await blob.arrayBuffer());
}
