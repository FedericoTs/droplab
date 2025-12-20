/**
 * Premium Hero Section
 *
 * $50M startup-quality hero with:
 * - Framer Motion text reveal animations
 * - Floating background blobs
 * - Enhanced dashboard preview
 * - NO fake social proof
 *
 * Phase 9.3 - Landing Page Redesign
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Mail, TrendingUp, Target, Activity, Sparkles } from 'lucide-react';
import { MiniAttributionChart } from './mini-attribution-chart';

interface HeroPremiumProps {
  onDemoClick?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom ease
    },
  },
};

const dashboardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.4,
    },
  },
};

export function HeroPremium({ onDemoClick }: HeroPremiumProps) {
  const [metrics, setMetrics] = useState({
    sent: 0,
    scans: 0,
    responseRate: 0,
    conversions: 0,
  });

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  // Animate metrics counting up
  useEffect(() => {
    const targetMetrics = {
      sent: 1247,
      scans: 423,
      responseRate: 33.9,
      conversions: 87,
    };

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setMetrics({
        sent: Math.floor(targetMetrics.sent * easeOut),
        scans: Math.floor(targetMetrics.scans * easeOut),
        responseRate: parseFloat((targetMetrics.responseRate * easeOut).toFixed(1)),
        conversions: Math.floor(targetMetrics.conversions * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setMetrics(targetMetrics);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden hero-gradient">
      {/* Floating Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-200/40 to-lime-200/30 rounded-full blur-3xl animate-blob-slow"
        />
        <motion.div
          style={{ y: useTransform(scrollY, [0, 500], [0, 100]) }}
          className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-lime-200/30 to-emerald-200/20 rounded-full blur-3xl animate-blob"
        />
        <motion.div
          style={{ y: useTransform(scrollY, [0, 500], [0, 50]) }}
          className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-100/40 to-teal-200/30 rounded-full blur-2xl animate-float-delayed"
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                The Attribution Platform for Physical Mail
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Offline Marketing.
              <br />
              <span className="text-gradient-primary">
                Online Attribution.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              You wouldn't run Google Ads without analytics.{' '}
              <span className="font-semibold text-slate-900">
                Why send direct mail blind?
              </span>
              {' '}Track every scan, click, and conversion with pixel-perfect precision.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all btn-hover-lift"
                onClick={onDemoClick}
              >
                Try Interactive Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 hover:bg-slate-50 transition-all"
                onClick={scrollToFeatures}
              >
                See How It Works
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Trust Indicators - Product focused, not fake social proof */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-600"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup in 60 seconds</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Enhanced Dashboard Preview */}
          <motion.div
            variants={dashboardVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div className="relative rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 animate-float">
              {/* Header with Live Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Campaign Performance
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-emerald-700">Live Data</span>
                </div>
              </div>

              {/* Enhanced Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Mail Sent */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600">Mail Sent</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                    {metrics.sent.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">+12.5% this week</div>
                </motion.div>

                {/* QR Scans */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="p-3 bg-gradient-to-br from-lime-50 to-lime-100/50 rounded-xl border border-lime-200/50 cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-lime-600" />
                    <span className="text-xs font-semibold text-slate-600">QR Scans</span>
                  </div>
                  <div className="text-2xl font-bold text-lime-900 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                    {metrics.scans.toLocaleString()}
                  </div>
                  <div className="text-xs text-lime-600 mt-1">{metrics.responseRate}% response</div>
                </motion.div>

                {/* Response Rate */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50 cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-slate-600">Response Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                    {metrics.responseRate}%
                  </div>
                  <div className="text-xs text-green-600 mt-1">Industry avg: 3-5%</div>
                </motion.div>

                {/* Conversions */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="p-3 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl border border-teal-200/50 cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold text-slate-600">Conversions</span>
                  </div>
                  <div className="text-2xl font-bold text-teal-900 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                    {metrics.conversions}
                  </div>
                  <div className="text-xs text-teal-600 mt-1">7.0% conversion</div>
                </motion.div>
              </div>

              {/* Attribution Funnel Chart */}
              <div className="mt-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
                  Attribution Funnel
                </p>
                <div className="h-32 rounded-lg overflow-hidden">
                  <MiniAttributionChart />
                </div>
              </div>

              {/* ROI Indicator */}
              <div className="mt-4 bg-gradient-to-r from-emerald-50 to-lime-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Campaign ROI:</span>
                  <span className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>412%</span>
                </div>
              </div>

              {/* Floating "tracking badge" */}
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: -6 }}
                transition={{ delay: 1, type: 'spring', stiffness: 300 }}
                className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-glow-pulse"
              >
                Live Tracking
              </motion.div>
            </div>

            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-lime-400 rounded-2xl blur-3xl opacity-15 -z-10 transform scale-95" />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1 h-2 bg-slate-400 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
