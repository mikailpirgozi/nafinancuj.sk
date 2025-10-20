import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generatePDF } from "../pdf-generator";

describe("PDF Generator", () => {
  let generatedPDFs: Buffer[] = [];

  afterAll(() => {
    // Cleanup
    generatedPDFs = [];
  });

  it("should generate a basic PDF from HTML", async () => {
    const html = `
      <html>
        <body>
          <h1>Test Document</h1>
          <p>This is a test PDF.</p>
        </body>
      </html>
    `;

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    // PDF files start with %PDF magic bytes
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });

  it("should handle Slovak characters (UTF-8) correctly", async () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Úverová Zmluva</h1>
          <p>Poskytovateľ: Slovenská Banka s.r.o.</p>
          <p>Dlžník: Ján Horvát</p>
          <p>IČO: 12345678</p>
          <p>DIČ: SK2012345678</p>
          <p>Adresa: Jesenná ulica č. 123, Bratislava</p>
        </body>
      </html>
    `;

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });

  it("should generate PDF with template variables replaced", async () => {
    const template = `
      <html>
        <body>
          <h1>Loan Contract</h1>
          <p>Client: {{client_name}}</p>
          <p>Amount: {{loan_amount}} EUR</p>
          <p>Interest Rate: {{loan_interest_rate}}%</p>
        </body>
      </html>
    `;

    const variables = {
      client_name: "ACME Corporation s.r.o.",
      loan_amount: "50,000.00",
      loan_interest_rate: "8.5",
    };

    let html = template;
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });

  it("should generate PDF with styling (CSS)", async () => {
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              color: #0066cc;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 10px;
            }
            .highlight {
              background-color: #ffff00;
              padding: 5px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            td {
              border: 1px solid #ddd;
              padding: 8px;
            }
          </style>
        </head>
        <body>
          <h1>Loan Information</h1>
          <table>
            <tr>
              <td>Client</td>
              <td><span class="highlight">Test Client</span></td>
            </tr>
            <tr>
              <td>Amount</td>
              <td>50,000 EUR</td>
            </tr>
            <tr>
              <td>Duration</td>
              <td>36 months</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });

  it("should generate PDF with complex HTML structure", async () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-size: 12px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 10px; }
            .field { display: flex; margin-bottom: 5px; }
            .label { width: 200px; font-weight: bold; }
            .value { flex: 1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ÚVEROVÁ ZMLUVA</h1>
            <p>Číslo zmluvy: 2024/0001</p>
          </div>
          <div class="section">
            <div class="section-title">I. ZMLUVNÉ STRANY</div>
            <div class="field">
              <div class="label">Poskytovateľ:</div>
              <div class="value">Slovenská Banka s.r.o.</div>
            </div>
            <div class="field">
              <div class="label">IČO:</div>
              <div class="value">12345678</div>
            </div>
            <div class="field">
              <div class="label">Dlžník:</div>
              <div class="value">Test Klient s.r.o.</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">II. PARAMETRE ÚVERU</div>
            <div class="field">
              <div class="label">Suma úveru:</div>
              <div class="value">50,000.00 EUR</div>
            </div>
            <div class="field">
              <div class="label">Úroková sadzba:</div>
              <div class="value">8.5% p.a.</div>
            </div>
            <div class="field">
              <div class="label">Trvanie:</div>
              <div class="value">36 mesiacov</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });

  it("should throw error on empty HTML", async () => {
    expect(async () => {
      await generatePDF("");
    }).rejects.toThrow();
  });

  it("should generate PDF with multi-page content", async () => {
    let html = `<html><head><style>body { page-break-after: always; }</style></head><body>`;

    for (let i = 1; i <= 3; i++) {
      html += `
        <div>
          <h1>Page ${i}</h1>
          <p>This is page ${i} of the document.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      `;
    }

    html += `</body></html>`;

    const pdf = await generatePDF(html);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf-8", 0, 4)).toBe("%PDF");
    generatedPDFs.push(pdf);
  });
});

