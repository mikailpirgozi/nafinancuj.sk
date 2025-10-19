/**
 * Finstat API Client Service
 * Dokumentácia: https://finstat.github.io/api-documentation/#/sk-api/sk/standard/premium
 */

export interface FinstatAddress {
  street: string;
  city: string;
  zip: string;
}

export interface FinstatCompanyData {
  ico: string;
  name: string;
  dic?: string;
  address: FinstatAddress;
  legalForm?: string;
  foundedAt?: string;
  employees?: number;
  revenue?: number;
  profit?: number;
  equity?: number;
}

/**
 * Fetch company data from Finstat API by ICO
 * @param ico - Company IČO (8 digits)
 * @returns Company data or null if not found
 */
export async function getCompanyByICO(ico: string): Promise<FinstatCompanyData | null> {
  try {
    // Validate ICO format
    if (!ico || !/^\d{8}$/.test(ico)) {
      console.error("Invalid ICO format:", ico);
      return null;
    }

    const apiKey = process.env.FINSTAT_PRIVATE_KEY;
    if (!apiKey) {
      console.error("FINSTAT_PRIVATE_KEY not configured");
      return null;
    }

    const response = await fetch(
      `https://www.finstat.sk/api/Detail?ico=${ico}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "Nafinancuj.sk/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error(`Finstat API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Map Finstat response to our interface
    return {
      ico: data.Ico || ico,
      name: data.Name || "",
      dic: data.DIC || undefined,
      address: {
        street: data.Street || "",
        city: data.City || "",
        zip: data.Zip || "",
      },
      legalForm: data.LegalForm || undefined,
      foundedAt: data.Created || undefined,
      employees: data.Employees ? parseInt(String(data.Employees)) : undefined,
      revenue: data.Revenue ? parseFloat(String(data.Revenue)) : undefined,
      profit: data.Profit ? parseFloat(String(data.Profit)) : undefined,
      equity: data.Equity ? parseFloat(String(data.Equity)) : undefined,
    };
  } catch (error) {
    console.error("Error fetching from Finstat:", error);
    return null;
  }
}

/**
 * Search companies by name in Finstat
 * @param query - Company name or part of it
 * @returns Array of matching companies
 */
export async function searchCompaniesByName(
  query: string
): Promise<Array<{ ico: string; name: string }>> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const apiKey = process.env.FINSTAT_PRIVATE_KEY;
    if (!apiKey) {
      return [];
    }

    const response = await fetch(
      `https://www.finstat.sk/api/Search?term=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.Results || []).map((item: { Ico: string; Name: string }) => ({
      ico: item.Ico,
      name: item.Name,
    }));
  } catch (error) {
    console.error("Error searching companies:", error);
    return [];
  }
}
