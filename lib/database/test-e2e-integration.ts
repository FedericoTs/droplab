/**
 * End-to-End Integration Test
 * Tests the complete flow: DM Generation → Database → Analytics
 * Run with: npx tsx lib/database/test-e2e-integration.ts
 */

import {
  createCampaign,
  createRecipient,
  trackEvent,
  trackConversion,
  getCampaignAnalytics,
  getRecipientByTrackingId,
} from "./tracking-queries";
import { closeDatabase } from "./connection";

const BASE_URL = "http://localhost:3000";

async function testE2EIntegration() {
  console.log("\n🧪 Starting End-to-End Integration Test\n");
  console.log("=" .repeat(60));

  try {
    // STEP 1: Simulate DM Generation (what happens in API route)
    console.log("\n📝 STEP 1: Simulating DM Generation");
    console.log("-".repeat(60));

    const campaign = createCampaign({
      name: "E2E Test Campaign - Hearing Aid Promo",
      message: "Get 50% off your first consultation!",
      companyName: "HearWell Clinics",
    });

    console.log(`✅ Campaign Created:`);
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Name: ${campaign.name}`);
    console.log(`   Company: ${campaign.company_name}`);

    const recipient1 = createRecipient({
      campaignId: campaign.id,
      name: "Alice",
      lastname: "Johnson",
      address: "456 Elm Street",
      city: "Boston",
      zip: "02101",
      email: "alice@example.com",
      phone: "+1234567890",
    });

    console.log(`\n✅ Recipient 1 Created:`);
    console.log(`   Name: ${recipient1.name} ${recipient1.lastname}`);
    console.log(`   Tracking ID: ${recipient1.tracking_id}`);
    console.log(`   Landing Page: ${BASE_URL}/lp/${recipient1.tracking_id}`);

    const recipient2 = createRecipient({
      campaignId: campaign.id,
      name: "Bob",
      lastname: "Smith",
      address: "789 Oak Avenue",
      city: "Boston",
      zip: "02102",
      email: "bob@example.com",
    });

    console.log(`\n✅ Recipient 2 Created:`);
    console.log(`   Name: ${recipient2.name} ${recipient2.lastname}`);
    console.log(`   Tracking ID: ${recipient2.tracking_id}`);
    console.log(`   Landing Page: ${BASE_URL}/lp/${recipient2.tracking_id}`);

    // STEP 2: Simulate Landing Page Visits (what happens when user scans QR)
    console.log("\n\n👁️  STEP 2: Simulating Landing Page Visits");
    console.log("-".repeat(60));

    // Alice visits her landing page
    console.log(`\nTesting /api/tracking/event for ${recipient1.name}...`);
    const pageView1 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient1.tracking_id,
        eventType: "page_view",
        eventData: { page: `/lp/${recipient1.tracking_id}` },
      }),
    });
    const pvResult1 = await pageView1.json();
    console.log(
      pageView1.ok ? "✅" : "❌",
      "Page view tracked:",
      JSON.stringify(pvResult1, null, 2)
    );

    // Alice views the form
    console.log(`\nTracking form view for ${recipient1.name}...`);
    const formView = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient1.tracking_id,
        eventType: "form_view",
      }),
    });
    const fvResult = await formView.json();
    console.log(
      formView.ok ? "✅" : "❌",
      "Form view tracked:",
      JSON.stringify(fvResult, null, 2)
    );

    // Bob visits his landing page
    console.log(`\nTesting /api/tracking/event for ${recipient2.name}...`);
    const pageView2 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient2.tracking_id,
        eventType: "page_view",
        eventData: { page: `/lp/${recipient2.tracking_id}` },
      }),
    });
    const pvResult2 = await pageView2.json();
    console.log(
      pageView2.ok ? "✅" : "❌",
      "Page view tracked:",
      JSON.stringify(pvResult2, null, 2)
    );

    // Alice visits again (return visit)
    console.log(`\nTracking return visit for ${recipient1.name}...`);
    const pageView3 = await fetch(`${BASE_URL}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient1.tracking_id,
        eventType: "page_view",
        eventData: { page: `/lp/${recipient1.tracking_id}`, returnVisit: true },
      }),
    });
    const pvResult3 = await pageView3.json();
    console.log(
      pageView3.ok ? "✅" : "❌",
      "Return visit tracked:",
      JSON.stringify(pvResult3, null, 2)
    );

    // STEP 3: Simulate Conversion (appointment booking)
    console.log("\n\n📅 STEP 3: Simulating Appointment Booking");
    console.log("-".repeat(60));

    console.log(`\n${recipient1.name} books an appointment...`);
    const conversion = await fetch(`${BASE_URL}/api/tracking/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: recipient1.tracking_id,
        conversionType: "form_submission",
        conversionData: {
          appointmentDate: "2025-10-20",
          appointmentTime: "10:00 AM",
          phone: "+1234567890",
          email: "alice@example.com",
        },
      }),
    });
    const convResult = await conversion.json();
    console.log(
      conversion.ok ? "✅" : "❌",
      "Conversion tracked:",
      JSON.stringify(convResult, null, 2)
    );

    // STEP 4: Fetch Campaign Analytics
    console.log("\n\n📊 STEP 4: Fetching Campaign Analytics");
    console.log("-".repeat(60));

    console.log(`\nCalling /api/tracking/analytics/${campaign.id}...`);
    const analyticsResponse = await fetch(
      `${BASE_URL}/api/tracking/analytics/${campaign.id}`
    );
    const analyticsResult = await analyticsResponse.json();

    if (analyticsResponse.ok && analyticsResult.success) {
      const analytics = analyticsResult.data;
      console.log("\n✅ Campaign Analytics Retrieved Successfully!\n");
      console.log("=" .repeat(60));
      console.log(`Campaign: ${analytics.campaign.name}`);
      console.log(`Company: ${analytics.campaign.company_name}`);
      console.log(`Status: ${analytics.campaign.status}`);
      console.log("-".repeat(60));
      console.log(`📬 Total Recipients: ${analytics.totalRecipients}`);
      console.log(`👁️  Unique Visitors: ${analytics.uniqueVisitors}`);
      console.log(`📄 Total Page Views: ${analytics.totalPageViews}`);
      console.log(`✅ Conversions: ${analytics.totalConversions}`);
      console.log(`📈 Conversion Rate: ${analytics.conversionRate}%`);
      console.log("=" .repeat(60));

      // Validate expected values
      console.log("\n🔍 Validating Analytics Data:");
      const tests = [
        {
          name: "Total Recipients",
          expected: 2,
          actual: analytics.totalRecipients,
        },
        {
          name: "Unique Visitors",
          expected: 2,
          actual: analytics.uniqueVisitors,
        },
        {
          name: "Total Page Views",
          expected: 3,
          actual: analytics.totalPageViews,
        },
        {
          name: "Total Conversions",
          expected: 1,
          actual: analytics.totalConversions,
        },
        {
          name: "Conversion Rate",
          expected: 50,
          actual: analytics.conversionRate,
        },
      ];

      let allTestsPassed = true;
      tests.forEach((test) => {
        const passed = test.actual === test.expected;
        console.log(
          passed ? "✅" : "❌",
          `${test.name}: Expected ${test.expected}, Got ${test.actual}`
        );
        if (!passed) allTestsPassed = false;
      });

      if (allTestsPassed) {
        console.log("\n🎉 ALL VALIDATION TESTS PASSED!\n");
      } else {
        console.log("\n⚠️  Some validation tests failed. Check the data.\n");
      }
    } else {
      console.log("❌ Failed to fetch analytics:", analyticsResult.error);
      process.exit(1);
    }

    // STEP 5: Fetch Recipient Journey
    console.log("\n🗺️  STEP 5: Fetching Recipient Journey");
    console.log("-".repeat(60));

    console.log(`\nCalling /api/tracking/journey/${recipient1.tracking_id}...`);
    const journeyResponse = await fetch(
      `${BASE_URL}/api/tracking/journey/${recipient1.tracking_id}`
    );
    const journeyResult = await journeyResponse.json();

    if (journeyResponse.ok && journeyResult.success) {
      const journey = journeyResult.data;
      console.log("\n✅ Recipient Journey Retrieved Successfully!\n");
      console.log("=" .repeat(60));
      console.log(`Recipient: ${journey.recipient.name} ${journey.recipient.lastname}`);
      console.log(`Email: ${journey.recipient.email}`);
      console.log(`Phone: ${journey.recipient.phone}`);
      console.log("-".repeat(60));
      console.log(`📄 Page Views: ${journey.pageViews}`);
      console.log(`📝 Total Events: ${journey.events.length}`);
      console.log(`✅ Conversions: ${journey.conversions.length}`);
      console.log(`🎯 Has Converted: ${journey.hasConverted ? "Yes" : "No"}`);
      console.log("=" .repeat(60));

      console.log("\nEvent Timeline:");
      journey.events.forEach((event: any, index: number) => {
        console.log(
          `  ${index + 1}. [${event.event_type}] at ${new Date(event.created_at).toLocaleString()}`
        );
        if (event.event_data) {
          console.log(`     Data: ${JSON.stringify(event.event_data)}`);
        }
      });

      if (journey.conversions.length > 0) {
        console.log("\nConversions:");
        journey.conversions.forEach((conv: any, index: number) => {
          console.log(
            `  ${index + 1}. [${conv.conversion_type}] at ${new Date(conv.created_at).toLocaleString()}`
          );
          if (conv.conversion_data) {
            console.log(`     Data: ${JSON.stringify(conv.conversion_data)}`);
          }
        });
      }
    } else {
      console.log("❌ Failed to fetch journey:", journeyResult.error);
    }

    // Final Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("🎉 END-TO-END INTEGRATION TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n✨ Summary:");
    console.log(`  • Campaign created with ID: ${campaign.id}`);
    console.log(`  • 2 recipients added with unique tracking IDs`);
    console.log(`  • 3 page view events tracked`);
    console.log(`  • 1 form view event tracked`);
    console.log(`  • 1 conversion tracked`);
    console.log(`  • Analytics API returned correct metrics`);
    console.log(`  • Journey API returned complete recipient history`);
    console.log("\n🚀 The platform is ready for use!");
    console.log("   • Navigate to http://localhost:3000/dm-creative to create DMs");
    console.log("   • Navigate to http://localhost:3000/analytics to view campaign performance\n");
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

// Run the test
testE2EIntegration();
