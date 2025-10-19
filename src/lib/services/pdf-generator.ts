import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface GeneratePDFParams {
  templateContent: string;
  variables: Record<string, string | number | boolean>;
  title?: string;
}

/**
 * Generate PDF from template with variable replacement
 */
export async function generateLoanAgreementPDF(
  params: GeneratePDFParams
): Promise<Buffer> {
  let content = params.templateContent;

  // Replace all variables in template
  Object.entries(params.variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, String(value));
  });

  // Split content into paragraphs for better rendering
  const paragraphs = content.split("\n").filter((p) => p.trim());

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{params.title || "Zmluva o pôžičke"}</Text>
        </View>

        {/* Content */}
        <View style={styles.section}>
          {paragraphs.map((paragraph, idx) => (
            <Text key={idx} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Podpis veriteľa</Text>
              <Text style={styles.signatureLine}>_____________________</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Podpis dlžníka</Text>
              <Text style={styles.signatureLine}>_____________________</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  // Generate PDF
  const blob = await pdf(<MyDocument />).toBlob();

  // Convert blob to buffer
  return Buffer.from(await blob.arrayBuffer());
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
    borderBottom: "2px solid #000",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  section: {
    marginBottom: 30,
    flex: 1,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 8,
    color: "#333",
    textAlign: "justify",
  },
  footer: {
    marginTop: 40,
    borderTop: "1px solid #ccc",
    paddingTop: 20,
  },
  signatureRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
  },
  signatureLabel: {
    fontSize: 10,
    marginBottom: 10,
    fontWeight: "bold",
  },
  signatureLine: {
    borderBottom: "1px solid #000",
    height: 20,
  },
});
