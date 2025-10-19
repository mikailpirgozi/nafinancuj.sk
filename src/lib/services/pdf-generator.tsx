import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface GeneratePDFParams {
  templateContent: string;
  variables: Record<string, string | number | boolean>;
  loanData?: {
    variableSymbol: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
    borderBottom: "2px solid #2563eb",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    lineHeight: 1.6,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#334155",
    textAlign: "justify",
  },
  footer: {
    marginTop: 40,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerSection: {
    width: "45%",
  },
  footerText: {
    fontSize: 10,
    marginBottom: 30,
    color: "#334155",
  },
  signature: {
    marginTop: 50,
    borderTop: "1px solid #000",
    paddingTop: 5,
    fontSize: 9,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: "#94a3b8",
  },
});

export async function generateLoanAgreementPDF(
  params: GeneratePDFParams
): Promise<Blob> {
  // Replace variables in template content
  let content = params.templateContent;
  Object.entries(params.variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, String(value));
  });

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ZMLUVA O PÔŽIČKE</Text>
          <Text style={styles.subtitle}>č. {params.loanData?.variableSymbol}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>{content}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Podpis veriteľa:</Text>
            <View style={styles.signature} />
          </View>
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Podpis dlžníka:</Text>
            <View style={styles.signature} />
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} />
      </Page>
    </Document>
  );

  try {
    const blob = await pdf(<MyDocument />).toBlob();
    return blob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

export async function generatePDFBuffer(params: GeneratePDFParams): Promise<Buffer> {
  const blob = await generateLoanAgreementPDF(params);
  return Buffer.from(await blob.arrayBuffer());
}
