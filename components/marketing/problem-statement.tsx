/**
 * Problem Statement Section
 *
 * Replaces social-proof.tsx with a product-focused value proposition.
 * Shows the "attribution gap" problem with real industry statistics.
 * NO fake client logos or testimonials.
 *
 * Phase 9.3 - Landing Page Redesign
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, HelpCircle, Eye, Target, BarChart3 } from 'lucide-react';

// Animated counter component
function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
      {count}{suffix}
    </span>
  );
}

export function ProblemStatement() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <section ref={sectionRef} className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              The Marketing Blind Spot
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The <span className="text-gradient-primary">$167 Billion</span> Attribution Gap
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Marketers spend billions on direct mail annually, but most can't answer a simple question:{' '}
              <span className="text-white font-semibold">"Did it work?"</span>
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {/* Stat 1 */}
            <motion.div
              variants={itemVariants}
              className="glass-card-dark rounded-2xl p-8 text-center group hover:border-emerald-500/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                <TrendingDown className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                <AnimatedCounter value={50} suffix="%" />
              </div>
              <p className="text-slate-400">
                of marketers <span className="text-red-400 font-medium">cannot attribute</span> offline campaigns to revenue
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              variants={itemVariants}
              className="glass-card-dark rounded-2xl p-8 text-center group hover:border-emerald-500/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <Eye className="w-7 h-7 text-amber-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                <AnimatedCounter value={73} suffix="%" />
              </div>
              <p className="text-slate-400">
                of direct mail campaigns <span className="text-amber-400 font-medium">lack tracking</span> beyond delivery confirmation
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              variants={itemVariants}
              className="glass-card-dark rounded-2xl p-8 text-center group hover:border-emerald-500/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                <AnimatedCounter value={29} suffix="%" />
              </div>
              <p className="text-slate-400">
                higher response rate for <span className="text-emerald-400 font-medium">tracked campaigns</span> vs. untracked
              </p>
            </motion.div>
          </motion.div>

          {/* Comparison: Before vs After */}
          <motion.div variants={itemVariants} className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Before - Without DropLab */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 p-8 overflow-hidden">
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                  Without Attribution
                </div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-red-400" />
                  </div>
                  The Black Box
                </h3>
                <ul className="space-y-4">
                  {[
                    'Mail sent... hope it arrived',
                    'No idea who engaged',
                    'Can\'t measure ROI',
                    '"Trust me, it works"',
                    'CFO questions every budget request',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-400">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* After - With DropLab */}
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border border-emerald-500/30 p-8 overflow-hidden">
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  With DropLab
                </div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  Full Transparency
                </h3>
                <ul className="space-y-4">
                  {[
                    'Track every QR scan in real-time',
                    'See exactly who engaged',
                    'Calculate precise ROI',
                    '"Here\'s the data"',
                    'CFO loves the numbers',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <p className="text-slate-400 mb-4">
              Join the marketers who've closed the attribution gap
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-emerald-400">
                <Target className="w-4 h-4" />
                <span>100% Attribution Accuracy</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <BarChart3 className="w-4 h-4" />
                <span>Real-Time Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Proven ROI</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
