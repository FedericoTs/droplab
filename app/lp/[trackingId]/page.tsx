"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLandingPageData, incrementPageVisit } from "@/lib/tracking";
import { trackPageView } from "@/lib/tracking-client";
import { LandingPageData } from "@/types/dm-creative";
import { HearingQuestionnaire, QuestionnaireResults } from "@/components/landing/hearing-questionnaire";
import { AppointmentForm } from "@/components/landing/appointment-form";
import { CheckCircle2, Heart, Users, Award } from "lucide-react";

export default function LandingPage() {
  const params = useParams();
  const trackingId = params.trackingId as string;
  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [questionnaireResults, setQuestionnaireResults] = useState<QuestionnaireResults | null>(null);

  useEffect(() => {
    const loadLandingPage = async () => {
      if (!trackingId) return;

      // Try to load from database first
      try {
        const response = await fetch(`/api/landing-pages/${trackingId}`);
        const result = await response.json();

        if (result.success && result.data) {
          // Database has the landing page data
          setPageData(result.data);
          setLoading(false);

          // Smart tracking: Only track if accessed externally
          const shouldTrack = checkIfExternalAccess();

          if (shouldTrack) {
            // Track in database (new SQLite tracking)
            trackPageView(trackingId, `/lp/${trackingId}`);
            console.log(`Landing page visit tracked (external): ${trackingId}`);
          } else {
            console.log(`Landing page preview (internal - not tracked): ${trackingId}`);
          }
          return;
        }
      } catch (error) {
        console.error("Error loading from database, trying localStorage:", error);
      }

      // Fallback to localStorage (legacy support)
      const data = getLandingPageData(trackingId);
      setPageData(data);
      setLoading(false);

      if (data) {
        // Smart tracking: Only track if accessed externally
        const shouldTrack = checkIfExternalAccess();

        if (shouldTrack) {
          // Track in localStorage (existing)
          incrementPageVisit(trackingId);

          // Track in database (new SQLite tracking)
          trackPageView(trackingId, `/lp/${trackingId}`);

          console.log(`Landing page visit tracked (external): ${trackingId}`);
        } else {
          console.log(`Landing page preview (internal - not tracked): ${trackingId}`);
        }
      }
    };

    loadLandingPage();
  }, [trackingId]);

  /**
   * Check if the page is being accessed externally (should track)
   * vs internally from the platform (preview mode - don't track)
   */
  const checkIfExternalAccess = (): boolean => {
    // Check if this is the first navigation (entered URL directly or from email/QR)
    // or navigated from external site
    const referrer = document.referrer;
    const currentHost = window.location.host;

    // If no referrer, user likely came from external source (QR code, direct link, email)
    if (!referrer) {
      return true;
    }

    // If referrer is from a different domain, it's external
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.host !== currentHost) {
        return true; // External domain
      }
    } catch (e) {
      // Invalid referrer URL, treat as external
      return true;
    }

    // Check if there's a special preview parameter (added by internal links)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('preview')) {
      return false; // Internal preview mode
    }

    // Check if accessed from within the platform (referrer is from same host and is a platform page)
    // Platform pages that should NOT trigger tracking: /analytics, /templates, /campaigns
    if (referrer.includes('/analytics') ||
        referrer.includes('/templates') ||
        referrer.includes('/campaigns') ||
        referrer.includes('/dm-creative')) {
      return false; // Internal navigation from platform
    }

    // Default to tracking (external access)
    return true;
  };

  const handleQuestionnaireComplete = (results: QuestionnaireResults) => {
    setQuestionnaireResults(results);
    setShowQuestionnaire(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your personalized experience...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <p className="text-slate-600">
            This personalized landing page could not be found or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Miracle-Ear Style */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">{pageData.companyName}</h1>
            <div className="text-sm text-slate-600">
              75+ Years of Excellence
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
              Welcome, {pageData.recipient.name}!
            </h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-xl md:text-2xl text-slate-700 leading-relaxed">
              {pageData.message}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Column - Benefits & Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-blue-900 mb-6">
                  Why Choose Miracle-Ear?
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Lifetime Aftercare</h4>
                      <p className="text-slate-600 text-sm">
                        Complimentary cleaning, adjustments, and support for as long as you own your hearing aids.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <Heart className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Personalized Care</h4>
                      <p className="text-slate-600 text-sm">
                        Each hearing aid is custom-programmed to your unique hearing profile and lifestyle needs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <Users className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">1,500+ Locations</h4>
                      <p className="text-slate-600 text-sm">
                        Convenient access to professional hearing care wherever you are in America.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <Award className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Latest Technology</h4>
                      <p className="text-slate-600 text-sm">
                        GENIUS™, MIRAGE™, and BLISS™ platforms with advanced features for clarity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-blue-900 text-white p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-4">Trusted Since 1948</h4>
                <p className="text-blue-100 leading-relaxed">
                  For over 75 years, Miracle-Ear has been helping people reconnect with the sounds that matter most. Join millions who have rediscovered the joy of hearing.
                </p>
              </div>
            </div>

            {/* Right Column - Questionnaire or Appointment Form */}
            <div>
              {showQuestionnaire ? (
                <HearingQuestionnaire onComplete={handleQuestionnaireComplete} />
              ) : (
                <AppointmentForm
                  recipientName={`${pageData.recipient.name} ${pageData.recipient.lastname}`}
                  questionnaireResults={questionnaireResults || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm mb-2">
            &copy; {new Date().getFullYear()} {pageData.companyName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Tracking ID: {trackingId} | Created: {new Date(pageData.createdAt).toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}
