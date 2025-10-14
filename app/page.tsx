"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Settings,
  FileText,
  Mail,
  BarChart3,
  Phone,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useSettings } from "@/lib/contexts/settings-context";

export default function HomePage() {
  const { settings, isLoaded } = useSettings();

  const isSetupComplete = isLoaded && settings.companyName && settings.openaiApiKey;

  const workflow = [
    {
      step: 1,
      title: "Setup Your Brand",
      description: "Configure company information and brand voice",
      icon: Settings,
      href: "/settings",
      completed: isSetupComplete,
      color: "blue",
    },
    {
      step: 2,
      title: "Generate Copy",
      description: "Create AI-powered marketing copy variations",
      icon: FileText,
      href: "/copywriting",
      completed: false,
      color: "purple",
    },
    {
      step: 3,
      title: "Create Direct Mail",
      description: "Design personalized DMs with QR codes",
      icon: Mail,
      href: "/dm-creative",
      completed: false,
      color: "orange",
    },
    {
      step: 4,
      title: "Track Performance",
      description: "Monitor campaigns and analyze results",
      icon: BarChart3,
      href: "/analytics",
      completed: false,
      color: "green",
    },
  ];

  const quickActions = [
    {
      title: "AI Copywriting",
      description: "Generate marketing copy variations",
      icon: FileText,
      href: "/copywriting",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Direct Mail Campaign",
      description: "Create personalized direct mail",
      icon: Mail,
      href: "/dm-creative",
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "View Analytics",
      description: "Check campaign performance",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Phone AI Agent",
      description: "Initiate AI-powered calls",
      icon: Phone,
      href: "/cc-operations",
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            AI Marketing Platform
          </h1>
        </div>
        <p className="text-xl text-slate-600">
          Automate your marketing with AI-powered copywriting, direct mail campaigns, and intelligent tracking
        </p>
      </div>

      {/* Setup Status Alert */}
      {!isSetupComplete && isLoaded && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Settings className="h-6 w-6 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Complete Your Setup
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Configure your company information and API keys to unlock all features
                </p>
                <Button asChild variant="default" size="sm">
                  <Link href="/settings">
                    Go to Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Get Started in 4 Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflow.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  item.completed ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${
                      item.color === 'blue' ? 'bg-blue-100' :
                      item.color === 'purple' ? 'bg-purple-100' :
                      item.color === 'orange' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        item.color === 'blue' ? 'text-blue-600' :
                        item.color === 'purple' ? 'text-purple-600' :
                        item.color === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    {item.completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    STEP {item.step}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={item.href}>
                      {item.completed ? 'Review' : 'Start'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardContent className="pt-6">
                    <div className={`p-3 rounded-lg ${action.color} w-fit mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Platform Stats */}
      {isSetupComplete && (
        <div className="mt-12 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Platform Ready
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              All systems configured. Start creating your first campaign!
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/copywriting">
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">
                  Manage Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
