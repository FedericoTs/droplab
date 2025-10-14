import { NextRequest, NextResponse } from "next/server";
import { generateQRCode } from "@/lib/qr-generator";
import { createCampaign, createRecipient } from "@/lib/database/tracking-queries";
import { RecipientData } from "@/types/dm-creative";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, message, companyContext, campaignName } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients provided" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Create campaign
    const companyName = companyContext?.companyName || "Unknown Company";
    const finalCampaignName = campaignName || `Batch DM Campaign - ${new Date().toLocaleDateString()}`;

    const campaign = createCampaign({
      name: finalCampaignName,
      message: message,
      companyName: companyName,
    });

    console.log(`Batch campaign created: ${campaign.id} - ${campaign.name}`);

    // Create recipients and generate QR codes
    const dmDataList = [];

    for (const recipient of recipients) {
      // Create recipient in database
      const dbRecipient = createRecipient({
        campaignId: campaign.id,
        name: recipient.name,
        lastname: recipient.lastname,
        address: recipient.address || undefined,
        city: recipient.city || undefined,
        zip: recipient.zip || undefined,
        email: recipient.email || undefined,
        phone: recipient.phone || undefined,
      });

      const trackingId = dbRecipient.tracking_id;

      // Generate landing page URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const landingPageUrl = `${baseUrl}/lp/${trackingId}`;

      // Generate QR code
      const qrCodeDataUrl = await generateQRCode(landingPageUrl);

      // Use custom message if provided, otherwise use default
      const finalMessage = (recipient as RecipientData & { customMessage?: string }).customMessage || message;

      dmDataList.push({
        trackingId,
        recipient,
        message: finalMessage,
        qrCodeDataUrl,
        landingPageUrl,
        createdAt: new Date(),
      });
    }

    console.log(`Created ${dmDataList.length} recipients in batch`);

    return NextResponse.json({
      success: true,
      data: dmDataList,
      campaignId: campaign.id,
      campaignName: campaign.name,
      count: dmDataList.length,
    });
  } catch (error: unknown) {
    console.error("Error generating batch direct mails:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate batch: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
