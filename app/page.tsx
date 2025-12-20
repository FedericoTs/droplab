/**
 * Marketing Homepage
 *
 * Premium $50M startup-quality landing page with:
 * - Framer Motion animations
 * - Clash Display + General Sans typography
 * - NO fake social proof
 * - Product-focused value proposition
 *
 * Phase 9.3 - Landing Page Redesign
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { HeroPremium } from '@/components/marketing/hero-premium';
import { ProblemStatement } from '@/components/marketing/problem-statement';
import { ValueProps } from '@/components/marketing/value-props';
import { PlatformShowcase } from '@/components/marketing/platform-showcase';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { ProductDeepDive } from '@/components/marketing/product-deep-dive';
import { PricingSection } from '@/components/marketing/pricing-section';
import { FAQ } from '@/components/marketing/faq';
import { DemoForm } from '@/components/marketing/demo-form';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export default function MarketingHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDemoClick = () => {
    // Scroll to demo section
    const demoSection = document.getElementById('demo');
    demoSection?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false); // Close mobile menu after clicking
  };

  const handleNavClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Floating Glass Effect */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl border border-white/20 shadow-lg">
            <div className="px-6 py-3 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/images/logo_icon_tbg.png"
                  alt="DropLab"
                  className="h-6 w-auto object-contain"
                />
                <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>DropLab</span>
              </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#demo"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Demo
              </a>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 shadow-md">
                  Get Started
                </Button>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 mx-auto max-w-7xl">
            <div className="glass-card rounded-xl border border-white/20 shadow-lg p-4 space-y-3">
              <button
                onClick={() => handleNavClick('features')}
                className="block w-full text-left text-sm font-medium text-slate-600 hover:text-emerald-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('pricing')}
                className="block w-full text-left text-sm font-medium text-slate-600 hover:text-emerald-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={handleDemoClick}
                className="block w-full text-left text-sm font-medium text-slate-600 hover:text-emerald-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Demo
              </button>
              <div className="pt-3 space-y-2 border-t border-slate-200">
                <Link href="/auth/login" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" className="block">
                  <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600 to-lime-600">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Premium with Animations */}
      <HeroPremium onDemoClick={handleDemoClick} />

      {/* Problem Statement - Replaces Social Proof */}
      <ProblemStatement />

      {/* Value Propositions */}
      <ValueProps />

      {/* Platform Showcase */}
      <div id="features">
        <PlatformShowcase />
      </div>

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks onDemoClick={handleDemoClick} />
      </div>

      {/* Product Deep Dive - Replaces Testimonials */}
      <ProductDeepDive />

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection onDemoClick={handleDemoClick} />
      </div>

      {/* FAQ */}
      <FAQ />

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              See the Attribution Magic
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get a personalized demo postcard via email. Scan the QR code to experience
              pixel-perfect tracking for yourself.
            </p>
          </div>

          {/* Demo Form */}
          <DemoForm />

          {/* Below Form - What Happens Next */}
          <div className="mt-12 bg-white rounded-xl p-8 shadow-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
              What happens after you submit?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold mb-3">
                  1
                </div>
                <p className="text-sm text-slate-600">
                  We generate a personalized demo postcard with your name
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-lime-100 text-lime-600 font-bold mb-3">
                  2
                </div>
                <p className="text-sm text-slate-600">
                  You receive it via email within 30 seconds
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold mb-3">
                  3
                </div>
                <p className="text-sm text-slate-600">
                  Scan the QR code to see live attribution tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),transparent)]" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to Close the <span className="text-gradient-primary">Attribution Gap</span>?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Stop guessing. Start knowing. Get complete visibility into your offline marketing performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDemoClick}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-lime-600 transition-all shadow-lg hover:shadow-xl btn-hover-lift"
            >
              Try Interactive Demo
            </button>
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all inline-block"
            >
              Start Your First Campaign
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free demo</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Setup in 60 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
