import { NextRequest, NextResponse } from "next/server";
import { generateCopyVariations } from "@/lib/ai/openai";
import { getBrandProfile } from "@/lib/database/tracking-queries";
import { CopywritingRequest, CopywritingResponse, BrandMetadata } from "@/types/copywriting";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body: CopywritingRequest = await request.json();
    const { prompt, companyContext } = body;

    if (!prompt || !companyContext) {
      return NextResponse.json(
        errorResponse("Missing required fields", "MISSING_FIELDS"),
        { status: 400 }
      );
    }

    // Get API key from environment or request (for demo, we'll use env)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        errorResponse("OpenAI API key not configured. Please add it in Settings.", "API_KEY_MISSING"),
        { status: 500 }
      );
    }

    // Check if brand profile exists for enhanced copywriting
    let brandProfile = null;
    let brandMetadata: BrandMetadata = {
      brandVoiceApplied: false,
    };

    try {
      brandProfile = getBrandProfile(companyContext.companyName);
      if (brandProfile) {
        console.log(`✨ Using brand profile for ${companyContext.companyName}`);

        // Parse brand data to create metadata
        const keyPhrases = brandProfile.key_phrases ? JSON.parse(brandProfile.key_phrases) : [];
        const values = brandProfile.brand_values ? JSON.parse(brandProfile.brand_values) : [];

        brandMetadata = {
          brandVoiceApplied: true,
          tone: brandProfile.tone || undefined,
          keyPhrasesCount: keyPhrases.length,
          valuesCount: values.length,
        };
      }
    } catch (error) {
      console.log("No brand profile found, using basic context");
    }

    const variations = await generateCopyVariations(
      prompt,
      companyContext,
      apiKey,
      brandProfile
    );

    return NextResponse.json(
      successResponse(
        {
          variations,
          brandMetadata,
        },
        "Copy variations generated successfully"
      )
    );
  } catch (error: unknown) {
    console.error("Error in copywriting API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      errorResponse(`Failed to generate copy variations: ${errorMessage}`, "GENERATION_ERROR"),
      { status: 500 }
    );
  }
}
