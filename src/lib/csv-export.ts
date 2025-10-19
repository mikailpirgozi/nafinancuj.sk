/**
 * CSV Export Utility
 * Exports data to CSV format with proper encoding
 */

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columnMapping?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Get headers
  const keys = Object.keys(data[0]) as Array<keyof T>;
  const headers = keys.map((key) => columnMapping?.[key] || String(key));

  // Convert data to CSV rows
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          // Handle different data types
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];

  // Create blob and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export clients to CSV
 */
export function exportClientsToCSV(clients: Array<{
  id: string;
  companyName: string | null;
  contactPerson: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  ico: string | null;
  employeesCount: number | null;
  annualRevenue: number | null;
  createdAt: string;
}>): void {
  const exportData = clients.map((client) => ({
    ID: client.id,
    "Názov firmy": client.companyName || "",
    "Kontaktná osoba": client.contactPerson,
    Email: client.email || "",
    Telefón: client.phone || "",
    Adresa: client.address || "",
    Mesto: client.city || "",
    PSČ: client.postalCode || "",
    IČO: client.ico || "",
    "Počet zamestnancov": client.employeesCount || "",
    "Ročný obrat (€)": client.annualRevenue ? (client.annualRevenue / 100).toFixed(2) : "",
    "Vytvorené": new Date(client.createdAt).toLocaleDateString("sk-SK"),
  }));

  exportToCSV(exportData, "klienti");
}

/**
 * Export loans to CSV
 */
export function exportLoansToCSV(loans: Array<{
  id: string;
  variableSymbol: string;
  amount: number;
  interestRateAnnual: string;
  productType: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: string;
  client: {
    companyName: string | null;
    contactPerson: string | null;
  } | null;
}>): void {
  const exportData = loans.map((loan) => ({
    ID: loan.id,
    "Variabilný symbol": loan.variableSymbol,
    Klient: loan.client?.companyName || loan.client?.contactPerson || "N/A",
    "Suma (€)": (loan.amount / 100).toFixed(2),
    "Úrok (% p.a.)": loan.interestRateAnnual,
    "Typ úveru": loan.productType === "AMORTIZING" ? "Amortizačný" : "Úrokový",
    "Trvanie (mesiace)": loan.durationMonths,
    "Dátum začiatku": new Date(loan.startDate).toLocaleDateString("sk-SK"),
    "Dátum konca": new Date(loan.endDate).toLocaleDateString("sk-SK"),
    Status: loan.status,
  }));

  exportToCSV(exportData, "uvery");
}

/**
 * Export applications to CSV
 */
export function exportApplicationsToCSV(applications: Array<{
  id: string;
  amount: number;
  purpose: string;
  status: string;
  durationMonths: number;
  createdAt: string;
  client: {
    companyName: string | null;
    contactPerson: string | null;
  } | null;
}>): void {
  const exportData = applications.map((app) => ({
    ID: app.id,
    Klient: app.client?.companyName || app.client?.contactPerson || "N/A",
    "Suma (€)": (app.amount / 100).toFixed(2),
    Účel: app.purpose,
    Status: app.status,
    "Trvanie (mesiace)": app.durationMonths,
    "Vytvorené": new Date(app.createdAt).toLocaleDateString("sk-SK"),
  }));

  exportToCSV(exportData, "ziadosti");
}

