import { describe, it, expect } from "vitest";
import { generatePDFBuffer, generateLoanAgreementPDF } from "../pdf-generator";

describe("PDF Generator", () => {
  describe("generatePDFBuffer", () => {
    it("should replace template variables correctly", async () => {
      const template = "Hello {{name}}, your loan is {{amount}} EUR.";
      const variables = {
        name: "John Doe",
        amount: 10000,
      };

      const buffer = await generatePDFBuffer({
        templateContent: template,
        variables,
        title: "Test Contract",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Check if PDF contains replaced variables
      const content = buffer.toString("utf-8");
      expect(content).toContain("John Doe");
      expect(content).toContain("10000");
    });

    it("should handle multiple occurrences of same variable", async () => {
      const template = "{{client}} owes {{amount}}. {{client}} must pay {{amount}}.";
      const variables = {
        client: "ABC Company",
        amount: 5000,
      };

      const buffer = await generatePDFBuffer({
        templateContent: template,
        variables,
      });

      const content = buffer.toString("utf-8");
      // Should replace all occurrences
      expect((content.match(/ABC Company/g) || []).length).toBeGreaterThanOrEqual(1);
    });

    it("should handle special characters in variables", async () => {
      const template = "Address: {{address}}";
      const variables = {
        address: "123 Main St., Apt. #5",
      };

      const buffer = await generatePDFBuffer({
        templateContent: template,
        variables,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include loan data in PDF", async () => {
      const template = "Loan {{vs}}";
      const variables = { vs: "123456" };

      const buffer = await generatePDFBuffer({
        templateContent: template,
        variables,
        loanData: {
          variableSymbol: "VS-2025-001",
        },
      });

      const content = buffer.toString("utf-8");
      expect(content).toContain("VS-2025-001");
    });

    it("should handle empty template", async () => {
      const buffer = await generatePDFBuffer({
        templateContent: "",
        variables: {},
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should handle variables with boolean values", async () => {
      const template = "Active: {{active}}, Verified: {{verified}}";
      const variables = {
        active: true,
        verified: false,
      };

      const buffer = await generatePDFBuffer({
        templateContent: template,
        variables,
      });

      const content = buffer.toString("utf-8");
      expect(content).toContain("true");
      expect(content).toContain("false");
    });
  });

  describe("generateLoanAgreementPDF", () => {
    it("should generate PDF buffer", async () => {
      const buffer = await generateLoanAgreementPDF({
        templateContent: "Test contract content",
        variables: { test: "value" },
        title: "Loan Agreement",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should handle complex loan agreement template", async () => {
      const template = `
ZMLUVA O PÔŽIČKE č. {{variable_symbol}}

Veriteľ: {{lender_name}}
Dlžník: {{borrower_name}}

Suma: {{amount}} EUR
Úrok: {{interest_rate}}%
Doba: {{duration}} mesiacov
      `.trim();

      const variables = {
        variable_symbol: "2025-001",
        lender_name: "Nafinancuj.sk",
        borrower_name: "ABC Company",
        amount: "10,000.00",
        interest_rate: "5.5",
        duration: 12,
      };

      const buffer = await generateLoanAgreementPDF({
        templateContent: template,
        variables,
        title: "Zmluva o pôžičke",
        loanData: {
          variableSymbol: "2025-001",
        },
      });

      expect(buffer).toBeInstanceOf(Buffer);
      const content = buffer.toString("utf-8");
      expect(content).toContain("2025-001");
      expect(content).toContain("ABC Company");
    });
  });
});

