"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Mail, Phone, Settings, BarChart3, Home, Sparkles, Bell } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home, section: "main" },
  { name: "Settings", href: "/settings", icon: Settings, section: "main" },
  { name: "Copywriting", href: "/copywriting", icon: FileText, section: "create" },
  { name: "DM Creative", href: "/dm-creative", icon: Mail, section: "create" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, section: "analyze" },
  { name: "Notifications", href: "/notifications", icon: Bell, section: "analyze" },
  { name: "CC Operations", href: "/cc-operations", icon: Phone, section: "advanced" },
];

const sections = [
  { id: "main", label: "Getting Started" },
  { id: "create", label: "Create" },
  { id: "analyze", label: "Analyze" },
  { id: "advanced", label: "Advanced" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">AI Marketing</h1>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {sections.map((section) => {
          const sectionItems = navigation.filter((item) => item.section === section.id);
          return (
            <div key={section.id} className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {section.label}
              </h3>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-slate-500">
          AI Marketing Platform Demo
        </p>
      </div>
    </div>
  );
}
