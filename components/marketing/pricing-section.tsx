/**
 * Pricing Section
 *
 * Transparent pricing with clear value proposition.
 * Shows the $499/month plan with credit system explanation.
 *
 * Phase 9.3 - Landing Page Redesign
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Zap, ArrowRight, Gift, Sparkles } from 'lucide-react';

interface PricingSectionProps {
  onDemoClick?: () => void;
}

const features = [
  'Unlimited postcard designs',
  'QR code tracking & attribution',
  'Real-time analytics dashboard',
  'AI copywriting assistant',
  'Personalized landing pages',
  'Audience targeting database access',
  'Direct mail fulfillment integration',
  'Priority support',
];

export function PricingSection({ onDemoClick }: PricingSectionProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),transparent)]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </span>
            <h2
              className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              One Plan. <span className="text-gradient-primary">Everything Included.</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              No hidden fees. No per-user pricing. No surprises.
            </p>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            variants={itemVariants}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-lime-500 text-white px-6 py-2 rounded-bl-2xl text-sm font-semibold">
                Most Popular
              </div>

              <div className="p-8 lg:p-10">
                {/* Plan Name */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Professional
                  </h3>
                  <p className="text-slate-600">Everything you need to run trackable direct mail campaigns</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>$499</span>
                  <span className="text-slate-500">/month</span>
                </div>

                {/* Credit System Callout */}
                <div className="bg-gradient-to-r from-emerald-50 to-lime-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Your First Month is Essentially Free</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Month 1: Pay $499, receive <strong className="text-emerald-600">$499 in platform credits</strong> to use on campaigns.
                      </p>
                      <p className="text-sm text-slate-600">
                        Month 2+: $499/month includes <strong className="text-emerald-600">$99 in credits</strong> plus full platform access.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all btn-hover-lift"
                    onClick={onDemoClick}
                  >
                    Start Free Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-center text-sm text-slate-500">
                    No credit card required. Try the interactive demo first.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FAQ Teaser */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <p className="text-slate-600">
              Questions about pricing?{' '}
              <a href="#faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Check our FAQ →
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
