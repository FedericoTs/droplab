import { CampaignExportData } from "../database/tracking-queries";

/**
 * Convert campaign recipients data to CSV format
 */
export function generateCampaignRecipientsCSV(data: CampaignExportData): string {
  const headers = [
    "Name",
    "Last Name",
    "Email",
    "Phone",
    "Address",
    "City",
    "ZIP",
    "Tracking ID",
    "Sent Date",
    "Page Views",
    "Events",
    "Conversions",
    "Status",
  ];

  const rows = data.recipients.map((recipient) => [
    recipient.name,
    recipient.lastname,
    recipient.email || "",
    recipient.phone || "",
    recipient.address || "",
    recipient.city || "",
    recipient.zip || "",
    recipient.tracking_id,
    new Date(recipient.sent_date).toLocaleDateString(),
    recipient.page_views.toString(),
    recipient.events.toString(),
    recipient.conversions.toString(),
    recipient.status,
  ]);

  return convertToCSV([headers, ...rows]);
}

/**
 * Convert all campaigns data to CSV format
 */
export function generateAllCampaignsCSV(campaigns: Array<{
  id: string;
  name: string;
  company_name: string;
  created_at: string;
  status: string;
  totalRecipients: number;
  uniqueVisitors: number;
  totalPageViews: number;
  totalConversions: number;
  conversionRate: number;
}>): string {
  const headers = [
    "Campaign Name",
    "Company",
    "Created Date",
    "Status",
    "Recipients",
    "Visitors",
    "Page Views",
    "Conversions",
    "Conversion Rate (%)",
  ];

  const rows = campaigns.map((campaign) => [
    campaign.name,
    campaign.company_name,
    new Date(campaign.created_at).toLocaleDateString(),
    campaign.status,
    campaign.totalRecipients.toString(),
    campaign.uniqueVisitors.toString(),
    campaign.totalPageViews.toString(),
    campaign.totalConversions.toString(),
    campaign.conversionRate.toFixed(1),
  ]);

  return convertToCSV([headers, ...rows]);
}

/**
 * Helper function to convert array of rows to CSV string
 */
function convertToCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(cell) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
