"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy Landing Page Route - Redirects to Campaign Landing Page
 *
 * This route is kept for backwards compatibility with existing QR codes and links.
 * It redirects tracking IDs to the new campaign-based landing page system which
 * supports custom templates created in the DM creative flow.
 *
 * Flow:
 * 1. Receive tracking ID from URL
 * 2. Look up recipient and campaign from database
 * 3. Redirect to /lp/campaign/{campaignId} with encrypted recipient ID
 * 4. New system loads custom template and tracks conversion properly
 */
export default function LegacyLandingPageRedirect() {
  const params = useParams();
  const router = useRouter();
  const trackingId = params.trackingId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToNewSystemPage = async () => {
      if (!trackingId) {
        setError("No tracking ID provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch recipient data including campaign_id
        const response = await fetch(`/api/landing-pages/${trackingId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          setError("Landing page not found");
          setLoading(false);
          return;
        }

        const pageData = result.data;

        // Check if we have a campaign_id
        if (!pageData.campaignId) {
          console.warn("No campaign ID found for tracking ID:", trackingId);
          // Fall back to showing a message - the old hardcoded template will be shown as fallback
          setError("This landing page is not associated with a campaign. Please contact support.");
          setLoading(false);
          return;
        }

        // Encrypt the recipient ID for the URL (for privacy)
        // For now, we'll use the tracking_id which is already encrypted
        const encryptedRecipientId = trackingId;

        // Redirect to new campaign landing page system
        const newUrl = `/lp/campaign/${pageData.campaignId}?r=${encryptedRecipientId}`;
        console.log(`Redirecting ${trackingId} to campaign landing page: ${newUrl}`);

        router.replace(newUrl);
      } catch (error) {
        console.error("Error loading landing page:", error);
        setError("Failed to load landing page");
        setLoading(false);
      }
    };

    redirectToNewSystemPage();
  }, [trackingId, router]);

  // Show loading state while redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your personalized page...</p>
        </div>
      </div>
    );
  }

  // Show error if redirect failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load Page</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <p className="text-sm text-slate-500">
            If you continue to see this message, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Should never reach here as we redirect, but just in case
  return null;
}
