'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Mail,
  Sparkles,
  BarChart3,
  Target,
  Users,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center mb-16">
          <img
            src="/images/logo_icon_tbg.png"
            alt="DropLab"
            className="h-16 w-auto object-contain mb-6"
          />
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            AI-Powered Marketing Automation
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl">
            Create personalized direct mail campaigns with AI copywriting,
            automated fulfillment, and intelligent tracking—all in one platform.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI Copywriting</CardTitle>
              </div>
              <CardDescription>
                Generate multiple campaign variations with different tones and
                target audiences using advanced AI.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Direct Mail Creative</CardTitle>
              </div>
              <CardDescription>
                Design beautiful, personalized direct mail with AI-generated
                backgrounds and dynamic QR codes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-green-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Smart Targeting</CardTitle>
              </div>
              <CardDescription>
                Access 250M+ contacts with Data Axle integration and
                intelligent audience filtering.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Automated Fulfillment</CardTitle>
              </div>
              <CardDescription>
                Send campaigns at scale with PostGrid integration—no printing
                or mailing required.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-pink-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
              </div>
              <CardDescription>
                Track QR scans, page views, and conversions with comprehensive
                campaign analytics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-indigo-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Multi-Tenant SaaS</CardTitle>
              </div>
              <CardDescription>
                Secure, scalable infrastructure with team collaboration and
                role-based access control.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
            Why Choose DropLab?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Save Time</h3>
                <p className="text-slate-600">Generate campaign copy and creative in minutes, not hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Increase Engagement</h3>
                <p className="text-slate-600">Personalized messages drive 6x higher response rates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Scale Effortlessly</h3>
                <p className="text-slate-600">From 100 to 100,000 recipients with automated fulfillment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Track Everything</h3>
                <p className="text-slate-600">Know exactly who engaged and converted from your campaigns</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of marketers using AI to create better campaigns faster.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-slate-100">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
