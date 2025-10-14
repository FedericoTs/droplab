import { NextRequest, NextResponse } from "next/server";
import { trackConversion } from "@/lib/database/tracking-queries";
import type { Conversion } from "@/lib/database/tracking-queries";

/**
 * POST /api/tracking/conversion
 * Track conversions (form submissions, appointments, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingId, conversionType, conversionData } = body;

    // Validation
    if (!trackingId || typeof trackingId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid tracking ID" },
        { status: 400 }
      );
    }

    if (!conversionType || typeof conversionType !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid conversion type" },
        { status: 400 }
      );
    }

    // Validate conversion type
    const validConversionTypes: Conversion["conversion_type"][] = [
      "form_submission",
      "appointment_booked",
      "call_initiated",
      "download",
    ];

    if (!validConversionTypes.includes(conversionType as Conversion["conversion_type"])) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid conversion type. Must be one of: ${validConversionTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Track the conversion
    const conversion = trackConversion({
      trackingId,
      conversionType: conversionType as Conversion["conversion_type"],
      conversionData: conversionData ? conversionData : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        conversionId: conversion.id,
        trackingId: conversion.tracking_id,
        conversionType: conversion.conversion_type,
        timestamp: conversion.created_at,
      },
    });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track conversion",
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/tracking/conversion
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
