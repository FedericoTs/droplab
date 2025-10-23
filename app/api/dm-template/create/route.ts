import { NextRequest, NextResponse } from "next/server";
import { createDMTemplate } from "@/lib/database/template-queries";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      canvasSessionId,
      name,
      canvasJSON,
      backgroundImage,
      canvasWidth,
      canvasHeight,
      previewImage,
      variableMappings,
    } = body;

    // Validate required fields
    if (!campaignId || !name || !canvasJSON || !backgroundImage) {
      return NextResponse.json(
        errorResponse("Missing required fields", "MISSING_FIELDS"),
        { status: 400 }
      );
    }

    // Create template
    const templateId = createDMTemplate({
      campaignId,
      canvasSessionId,
      name,
      canvasJSON,
      backgroundImage,
      canvasWidth,
      canvasHeight,
      previewImage,
      variableMappings,
    });

    console.log(`✅ DM template created: ${templateId}`);

    return NextResponse.json(
      successResponse({ templateId }, "DM template created successfully")
    );
  } catch (error) {
    console.error("Error creating DM template:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to create DM template",
        "CREATE_ERROR"
      ),
      { status: 500 }
    );
  }
}
