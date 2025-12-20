/**
 * Product Deep Dive Section
 *
 * Replaces testimonials.tsx with feature showcase.
 * Shows what you get with DropLab - no fake testimonials.
 *
 * Phase 9.3 - Landing Page Redesign
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Palette,
  Users,
  BarChart3,
  Zap,
  QrCode,
  Mail,
  Wand2,
  Globe,
  FileText,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Design Editor',
    description: 'Drag-and-drop postcard designer with print-ready output',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: QrCode,
    title: 'QR Tracking',
    description: 'Unique QR codes for each recipient with real-time scan tracking',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Users,
    title: 'Audience Builder',
    description: 'Access millions of verified contacts with advanced filtering',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    description: 'Real-time dashboard with scans, clicks, and conversions',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Wand2,
    title: 'AI Copywriting',
    description: 'Generate high-converting marketing copy in seconds',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'Landing Pages',
    description: 'Personalized landing pages that track every interaction',
    gradient: 'from-lime-500 to-green-500',
  },
];

const comparisonData = [
  { feature: 'Design postcards', manual: '2-4 hours', droplab: '10 minutes' },
  { feature: 'Track QR scans', manual: 'Not possible', droplab: 'Real-time' },
  { feature: 'Attribution accuracy', manual: '~10%', droplab: '100%' },
  { feature: 'Campaign ROI', manual: 'Guesswork', droplab: 'Precise data' },
  { feature: 'Landing pages', manual: 'Hire developer', droplab: 'Auto-generated' },
  { feature: 'Audience targeting', manual: 'Buy lists separately', droplab: 'Built-in' },
];

export function ProductDeepDive() {
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
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-50 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-lime-50 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Everything You Need
            </span>
            <h2
              className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              One Platform. <span className="text-gradient-primary">Complete Attribution.</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From design to delivery to data - everything you need to run trackable direct mail campaigns.
            </p>
          </motion.div>

          {/* Feature Grid - Bento Style */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all cursor-default"
                >
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Comparison Table */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Manual Process vs. DropLab
              </h3>
              <p className="text-slate-600">See how much time and guesswork you'll save</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                <div className="px-6 py-4 text-sm font-semibold text-slate-600">Feature</div>
                <div className="px-6 py-4 text-sm font-semibold text-slate-600 text-center border-l border-slate-200">
                  Manual Process
                </div>
                <div className="px-6 py-4 text-sm font-semibold text-emerald-600 text-center border-l border-slate-200 bg-emerald-50/50">
                  With DropLab
                </div>
              </div>

              {/* Table Rows */}
              {comparisonData.map((row, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="grid grid-cols-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="px-6 py-4 text-sm text-slate-700 font-medium">{row.feature}</div>
                  <div className="px-6 py-4 text-sm text-slate-500 text-center border-l border-slate-100">
                    {row.manual}
                  </div>
                  <div className="px-6 py-4 text-sm text-emerald-600 text-center font-semibold border-l border-slate-100 bg-emerald-50/30">
                    {row.droplab}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              <span>USPS Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span>GDPR Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
