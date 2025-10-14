import { NextRequest, NextResponse } from "next/server";
import { getRecipientJourney } from "@/lib/database/tracking-queries";

/**
 * GET /api/tracking/journey/[trackingId]
 * Get complete recipient journey (events, conversions, analytics)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    if (!trackingId) {
      return NextResponse.json(
        { success: false, error: "Missing tracking ID" },
        { status: 400 }
      );
    }

    const journey = getRecipientJourney(trackingId);

    if (!journey) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Parse JSON data from events and conversions
    const parsedJourney = {
      ...journey,
      events: journey.events.map((event) => ({
        ...event,
        event_data: event.event_data
          ? JSON.parse(event.event_data)
          : undefined,
      })),
      conversions: journey.conversions.map((conversion) => ({
        ...conversion,
        conversion_data: conversion.conversion_data
          ? JSON.parse(conversion.conversion_data)
          : undefined,
      })),
    };

    return NextResponse.json({
      success: true,
      data: parsedJourney,
    });
  } catch (error) {
    console.error("Error fetching recipient journey:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch journey",
      },
      { status: 500 }
    );
  }
}
