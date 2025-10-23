/**
 * Client-side tracking helper functions
 * Used by components to send tracking events to API
 */

export interface TrackEventParams {
  trackingId: string;
  eventType: "page_view" | "qr_scan" | "button_click" | "form_view" | "external_link";
  eventData?: Record<string, unknown>;
}

export interface TrackConversionParams {
  trackingId: string;
  conversionType: "form_submission" | "appointment_booked" | "call_initiated" | "download";
  conversionData?: Record<string, unknown>;
}

/**
 * Track an event via API
 */
export async function trackEventClient(params: TrackEventParams): Promise<void> {
  try {
    const response = await fetch("/api/tracking/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to track event:", error);
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}

/**
 * Track a conversion via API
 */
export async function trackConversionClient(params: TrackConversionParams): Promise<void> {
  try {
    const response = await fetch("/api/tracking/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to track conversion:", error);
    }
  } catch (error) {
    console.error("Error tracking conversion:", error);
  }
}

/**
 * Track page view (convenience function)
 */
export async function trackPageView(trackingId: string, pageUrl?: string): Promise<void> {
  await trackEventClient({
    trackingId,
    eventType: "page_view",
    eventData: pageUrl ? { page: pageUrl } : undefined,
  });
}

/**
 * Track button click (convenience function)
 */
export async function trackButtonClick(
  trackingId: string,
  buttonLabel: string
): Promise<void> {
  await trackEventClient({
    trackingId,
    eventType: "button_click",
    eventData: { button: buttonLabel },
  });
}

/**
 * Track form submission (convenience function)
 */
export async function trackFormSubmission(
  trackingId: string,
  formData: Record<string, unknown>
): Promise<void> {
  await trackConversionClient({
    trackingId,
    conversionType: "form_submission",
    conversionData: formData,
  });
}

/**
 * Track appointment booking (convenience function)
 * CRITICAL: Use this for appointment forms to ensure Sankey diagram shows web appointments correctly
 * This tracks as "appointment_booked" which is what the Sankey query expects
 */
export async function trackAppointmentBooked(
  trackingId: string,
  appointmentData: Record<string, unknown>
): Promise<void> {
  await trackConversionClient({
    trackingId,
    conversionType: "appointment_booked",
    conversionData: appointmentData,
  });
}
