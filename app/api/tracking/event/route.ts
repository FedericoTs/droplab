import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/database/tracking-queries";
import type { Event } from "@/lib/database/tracking-queries";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

/**
 * POST /api/tracking/event
 * Track user events (page views, clicks, interactions)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingId, eventType, eventData } = body;

    // Validation
    if (!trackingId || typeof trackingId !== "string") {
      return NextResponse.json(
        errorResponse("Missing or invalid tracking ID", "INVALID_TRACKING_ID"),
        { status: 400 }
      );
    }

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json(
        errorResponse("Missing or invalid event type", "INVALID_EVENT_TYPE"),
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes: Event["event_type"][] = [
      "page_view",
      "qr_scan",
      "button_click",
      "form_view",
      "external_link",
    ];

    if (!validEventTypes.includes(eventType as Event["event_type"])) {
      return NextResponse.json(
        errorResponse(
          `Invalid event type. Must be one of: ${validEventTypes.join(", ")}`,
          "INVALID_EVENT_TYPE"
        ),
        { status: 400 }
      );
    }

    // Extract IP address and user agent from request
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    const userAgent = request.headers.get("user-agent") || undefined;

    // Track the event
    const event = trackEvent({
      trackingId,
      eventType: eventType as Event["event_type"],
      eventData: eventData ? eventData : undefined,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      successResponse(
        {
          eventId: event.id,
          trackingId: event.tracking_id,
          eventType: event.event_type,
          timestamp: event.created_at,
        },
        "Event tracked successfully"
      )
    );
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to track event",
        "TRACKING_ERROR"
      ),
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/tracking/event
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
