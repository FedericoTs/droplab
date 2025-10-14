import { NextRequest, NextResponse } from "next/server";
import { generateQRCode } from "@/lib/qr-generator";
import { generateDMCreativeImage } from "@/lib/ai/openai";
import { createCampaign, createRecipient } from "@/lib/database/tracking-queries";
// Note: Image composition moved to client-side to avoid native module issues
import {
  DMGenerateRequest,
  DMGenerateResponse,
  DirectMailData,
} from "@/types/dm-creative";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, message, companyContext, apiKey, campaignName } = body;

    if (!recipient || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key is required" },
        { status: 400 }
      );
    }

    // Create or get campaign
    const companyName = companyContext?.companyName || "Unknown Company";
    const finalCampaignName = campaignName || `DM Campaign - ${new Date().toLocaleDateString()}`;

    const campaign = createCampaign({
      name: finalCampaignName,
      message: message,
      companyName: companyName,
    });

    console.log(`Campaign created: ${campaign.id} - ${campaign.name}`);

    // Create recipient in database (this also generates the tracking ID)
    const dbRecipient = createRecipient({
      campaignId: campaign.id,
      name: recipient.name,
      lastname: recipient.lastname,
      address: recipient.address,
      city: recipient.city,
      zip: recipient.zip,
      email: recipient.email,
      phone: recipient.phone,
    });

    const trackingId = dbRecipient.tracking_id;
    console.log(`Recipient created with tracking ID: ${trackingId}`);

    // Generate landing page URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const landingPageUrl = `${baseUrl}/lp/${trackingId}`;

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(landingPageUrl);

    console.log("Generating AI creative image with DALL-E...");

    // Generate AI background image with DALL-E
    const backgroundImage = await generateDMCreativeImage(
      message,
      companyContext,
      apiKey
    );

    console.log("AI background image generated successfully");
    console.log("Note: Final composition will be done client-side");

    // Create direct mail data
    // Note: creativeImageUrl will be composed on client-side to avoid canvas native module issues
    const dmData: DirectMailData = {
      trackingId,
      recipient,
      message,
      qrCodeDataUrl,
      landingPageUrl,
      createdAt: new Date(),
      creativeImageUrl: backgroundImage, // Pass background, client will compose
    };

    const response: DMGenerateResponse = {
      success: true,
      data: dmData,
      campaignId: campaign.id, // Include campaign ID for reference
      campaignName: campaign.name,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error generating direct mail:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate direct mail: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
