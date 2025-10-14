"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Clock, TrendingDown, Award, Save, Eye } from "lucide-react";
import { NotificationSettings, defaultNotificationSettings } from "@/types/notifications";
import { toast } from "sonner";

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onPreview?: () => void;
}

export function NotificationSettingsComponent({
  settings: initialSettings,
  onSave,
  onPreview,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    initialSettings || defaultNotificationSettings
  );
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      toast.success("Notification settings saved successfully");
    } catch (error) {
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (day: number) => {
    const currentDays = settings.digestDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateSetting("digestDays", newDays);
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-600" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>Configure your email address and notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Notification Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting("email", e.target.value)}
              placeholder="your.email@company.com"
            />
            <p className="text-xs text-slate-500">
              We'll send campaign notifications and performance updates to this address
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="enable-notifications">Enable Email Notifications</Label>
              <p className="text-sm text-slate-500">Receive email alerts for campaign events</p>
            </div>
            <Switch
              id="enable-notifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <CardTitle>Alert Types</CardTitle>
          </div>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="conversion-alerts" className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                Conversion Alerts
              </Label>
              <p className="text-sm text-slate-500">
                Get notified immediately when someone converts
              </p>
            </div>
            <Switch
              id="conversion-alerts"
              checked={settings.conversionAlerts}
              onCheckedChange={(checked) => updateSetting("conversionAlerts", checked)}
              disabled={!settings.enableNotifications}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="performance-digests" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                Performance Digests
              </Label>
              <p className="text-sm text-slate-500">
                Regular summaries of your campaign performance
              </p>
            </div>
            <Switch
              id="performance-digests"
              checked={settings.performanceDigests}
              onCheckedChange={(checked) => updateSetting("performanceDigests", checked)}
              disabled={!settings.enableNotifications}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="threshold-alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-600" />
                Threshold Alerts
              </Label>
              <p className="text-sm text-slate-500">
                Alerts when performance drops below thresholds
              </p>
            </div>
            <Switch
              id="threshold-alerts"
              checked={settings.thresholdAlerts}
              onCheckedChange={(checked) => updateSetting("thresholdAlerts", checked)}
              disabled={!settings.enableNotifications}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="campaign-milestones" className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                Campaign Milestones
              </Label>
              <p className="text-sm text-slate-500">
                Celebrate achievements (100 recipients, 50 conversions, etc.)
              </p>
            </div>
            <Switch
              id="campaign-milestones"
              checked={settings.campaignMilestones}
              onCheckedChange={(checked) => updateSetting("campaignMilestones", checked)}
              disabled={!settings.enableNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      {settings.performanceDigests && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <CardTitle>Digest Schedule</CardTitle>
            </div>
            <CardDescription>Customize when you receive performance summaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Frequency</Label>
                <Select
                  value={settings.digestFrequency}
                  onValueChange={(value: any) => updateSetting("digestFrequency", value)}
                >
                  <SelectTrigger id="digest-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="digest-time">Send At</Label>
                <Input
                  id="digest-time"
                  type="time"
                  value={settings.digestTime}
                  onChange={(e) => updateSetting("digestTime", e.target.value)}
                />
              </div>
            </div>

            {settings.digestFrequency === "weekly" && (
              <div className="space-y-2">
                <Label>Send On</Label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        settings.digestDays?.includes(index)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Threshold Settings */}
      {settings.thresholdAlerts && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-slate-600" />
              <CardTitle>Alert Thresholds</CardTitle>
            </div>
            <CardDescription>Get alerted when metrics fall below these values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="low-conversion">Low Conversion Rate (%)</Label>
                <Input
                  id="low-conversion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.lowConversionThreshold}
                  onChange={(e) =>
                    updateSetting("lowConversionThreshold", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-slate-500">Alert if conversion rate drops below this</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="low-engagement">Low Engagement Rate (%)</Label>
                <Input
                  id="low-engagement"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.lowEngagementThreshold}
                  onChange={(e) =>
                    updateSetting("lowEngagementThreshold", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-slate-500">Alert if visitor rate drops below this</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>Pause non-urgent notifications during specific hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <p className="text-sm text-slate-500">Mute notifications during these hours</p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.enableQuietHours}
              onCheckedChange={(checked) => updateSetting("enableQuietHours", checked)}
            />
          </div>

          {settings.enableQuietHours && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => updateSetting("quietHoursStart", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => updateSetting("quietHoursEnd", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Content Preferences</CardTitle>
          <CardDescription>Customize what's included in your emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="include-charts">Include Charts</Label>
              <p className="text-sm text-slate-500">Add performance charts to digest emails</p>
            </div>
            <Switch
              id="include-charts"
              checked={settings.includeCharts}
              onCheckedChange={(checked) => updateSetting("includeCharts", checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="include-recommendations">Include AI Recommendations</Label>
              <p className="text-sm text-slate-500">Get smart insights and suggestions</p>
            </div>
            <Switch
              id="include-recommendations"
              checked={settings.includeRecommendations}
              onCheckedChange={(checked) => updateSetting("includeRecommendations", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || !settings.email} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        {onPreview && (
          <Button variant="outline" onClick={onPreview} className="gap-2">
            <Eye className="h-4 w-4" />
            Preview Notifications
          </Button>
        )}
      </div>
    </div>
  );
}
