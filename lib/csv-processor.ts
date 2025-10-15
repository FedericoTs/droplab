import Papa from "papaparse";
import { RecipientData } from "@/types/dm-creative";

export interface CSVRow {
  name: string;
  lastname: string;
  address?: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
  customMessage?: string;
  storeNumber?: string; // Optional: for retail module store deployment
}

export interface CSVProcessResult {
  success: boolean;
  recipients: RecipientData[];
  errors: string[];
}

export function parseCSV(file: File): Promise<CSVProcessResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const recipients: RecipientData[] = [];

        (results.data as CSVRow[]).forEach((row, index) => {
          // Validate required fields
          if (!row.name || !row.lastname) {
            errors.push(
              `Row ${index + 1}: Missing required fields (name, lastname)`
            );
            return;
          }

          recipients.push({
            name: row.name.trim(),
            lastname: row.lastname.trim(),
            address: row.address?.trim() || "",
            city: row.city?.trim() || "",
            zip: row.zip?.trim() || "",
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            customMessage: row.customMessage?.trim() || "",
            storeNumber: row.storeNumber?.trim() || undefined,
          });
        });

        resolve({
          success: errors.length === 0,
          recipients,
          errors,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          recipients: [],
          errors: [`Failed to parse CSV: ${error.message}`],
        });
      },
    });
  });
}

export function generateSampleCSV(includeStoreNumbers: boolean = false): string {
  const headers = ["name", "lastname", "address", "city", "zip", "email", "phone", "customMessage"];

  if (includeStoreNumbers) {
    headers.push("storeNumber");
  }

  const sampleRows = includeStoreNumbers
    ? [
        ["John", "Doe", "123 Main St", "New York", "10001", "john@example.com", "555-0101", "", "001"],
        ["Jane", "Smith", "456 Oak Ave", "Los Angeles", "90001", "jane@example.com", "555-0102", "", "002"],
        ["Bob", "Johnson", "789 Pine Rd", "Chicago", "60601", "bob@example.com", "555-0103", "", "001"],
      ]
    : [
        ["John", "Doe", "123 Main St", "New York", "10001", "john@example.com", "555-0101", ""],
        ["Jane", "Smith", "456 Oak Ave", "Los Angeles", "90001", "jane@example.com", "555-0102", ""],
        ["Bob", "Johnson", "789 Pine Rd", "Chicago", "60601", "bob@example.com", "555-0103", ""],
      ];

  return [headers, ...sampleRows].map((row) => row.join(",")).join("\n");
}

/**
 * Analyze recipients and group by store number
 * Useful for previewing store deployment before campaign generation
 */
export interface StoreDistribution {
  storeNumber: string;
  count: number;
  recipients: RecipientData[];
}

export function analyzeStoreDistribution(recipients: RecipientData[]): {
  hasStoreNumbers: boolean;
  totalRecipients: number;
  recipientsWithStores: number;
  recipientsWithoutStores: number;
  storeDistribution: StoreDistribution[];
  uniqueStores: string[];
} {
  const withStores = recipients.filter((r) => r.storeNumber);
  const withoutStores = recipients.filter((r) => !r.storeNumber);

  // Group by store number
  const storeMap = new Map<string, RecipientData[]>();
  withStores.forEach((recipient) => {
    const storeNumber = recipient.storeNumber!;
    if (!storeMap.has(storeNumber)) {
      storeMap.set(storeNumber, []);
    }
    storeMap.get(storeNumber)!.push(recipient);
  });

  const storeDistribution: StoreDistribution[] = Array.from(storeMap.entries()).map(
    ([storeNumber, recipients]) => ({
      storeNumber,
      count: recipients.length,
      recipients,
    })
  );

  // Sort by store number
  storeDistribution.sort((a, b) => a.storeNumber.localeCompare(b.storeNumber));

  return {
    hasStoreNumbers: withStores.length > 0,
    totalRecipients: recipients.length,
    recipientsWithStores: withStores.length,
    recipientsWithoutStores: withoutStores.length,
    storeDistribution,
    uniqueStores: Array.from(storeMap.keys()).sort(),
  };
}
