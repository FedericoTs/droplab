/**
 * API Routes Test Script
 * Tests tracking API endpoints
 * Run dev server first: npm run dev
 * Then run: npx tsx lib/database/test-api.ts
 */

const BASE_URL = "http://localhost:3000";

async function testAPIs() {
  console.log("\n🧪 Starting API tests...\n");

  try {
    // First, create test data using direct database calls
    const { createCampaign, createRecipient } = await import(
      "./tracking-queries"
    );

    console.log("Setting up test data...");
    const campaign = createCampaign({
      name: "API Test Campaign",
      message: "Testing tracking APIs",
      companyName: "Test Company",
    });

    const recipient = createRecipient({
      campaignId: campaign.id,
      name: "Jane",
      lastname: "Smith",
      address: "456 Oak Ave",
      city: "Boston",
      zip: "02101",
    });

    console.log(`✅ Test campaign created: ${campaign.id}`);
    console.log(`✅ Test recipient created: ${recipient.tracking_id}\n`);

    // Test 1: Track page view event
    console.log("Test 1: POST /api/tracking/event (page_view)");
    const eventResponse1 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient.tracking_id,
        eventType: "page_view",
        eventData: { page: "/lp/" + recipient.tracking_id },
      }),
    });
    const eventData1 = await eventResponse1.json();
    console.log(
      eventResponse1.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(eventData1, null, 2),
      "\n"
    );

    // Test 2: Track QR scan event
    console.log("Test 2: POST /api/tracking/event (qr_scan)");
    const eventResponse2 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient.tracking_id,
        eventType: "qr_scan",
        eventData: { source: "direct_mail", timestamp: new Date().toISOString() },
      }),
    });
    const eventData2 = await eventResponse2.json();
    console.log(
      eventResponse2.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(eventData2, null, 2),
      "\n"
    );

    // Test 3: Track form view event
    console.log("Test 3: POST /api/tracking/event (form_view)");
    const eventResponse3 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient.tracking_id,
        eventType: "form_view",
      }),
    });
    const eventData3 = await eventResponse3.json();
    console.log(
      eventResponse3.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(eventData3, null, 2),
      "\n"
    );

    // Test 4: Track conversion
    console.log("Test 4: POST /api/tracking/conversion (appointment_booked)");
    const conversionResponse = await fetch(
      `${BASE_URL}/api/tracking/conversion`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: recipient.tracking_id,
          conversionType: "appointment_booked",
          conversionData: {
            date: "2024-08-20",
            time: "2:00 PM",
            type: "Free Consultation",
          },
        }),
      }
    );
    const conversionData = await conversionResponse.json();
    console.log(
      conversionResponse.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(conversionData, null, 2),
      "\n"
    );

    // Test 5: Get recipient journey
    console.log("Test 5: GET /api/tracking/journey/[trackingId]");
    const journeyResponse = await fetch(
      `${BASE_URL}/api/tracking/journey/${recipient.tracking_id}`
    );
    const journeyData = await journeyResponse.json();
    console.log(
      journeyResponse.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(journeyData, null, 2).substring(0, 500) + "...\n"
    );

    // Test 6: Get campaign analytics
    console.log("Test 6: GET /api/tracking/analytics/[campaignId]");
    const analyticsResponse = await fetch(
      `${BASE_URL}/api/tracking/analytics/${campaign.id}`
    );
    const analyticsData = await analyticsResponse.json();
    console.log(
      analyticsResponse.ok ? "✅" : "❌",
      "Response:",
      JSON.stringify(analyticsData, null, 2),
      "\n"
    );

    // Test 7: Error handling - Invalid tracking ID
    console.log("Test 7: Error handling - Invalid tracking ID");
    const errorResponse = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "invalid-id",
        eventType: "page_view",
      }),
    });
    const errorData = await errorResponse.json();
    console.log(
      errorResponse.ok ? "❌ Should fail" : "✅ Correctly failed",
      "Response:",
      JSON.stringify(errorData, null, 2),
      "\n"
    );

    // Test 8: Error handling - Invalid event type
    console.log("Test 8: Error handling - Invalid event type");
    const errorResponse2 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient.tracking_id,
        eventType: "invalid_type",
      }),
    });
    const errorData2 = await errorResponse2.json();
    console.log(
      errorResponse2.ok ? "❌ Should fail" : "✅ Correctly failed",
      "Response:",
      JSON.stringify(errorData2, null, 2),
      "\n"
    );

    console.log("🎉 All API tests completed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testAPIs();
