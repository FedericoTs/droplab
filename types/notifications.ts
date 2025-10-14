export interface NotificationSettings {
  email: string;
  enableNotifications: boolean;

  // Alert Types
  conversionAlerts: boolean;
  performanceDigests: boolean;
  thresholdAlerts: boolean;
  campaignMilestones: boolean;

  // Digest Settings
  digestFrequency: "daily" | "weekly" | "none";
  digestTime: string; // HH:MM format
  digestDays?: number[]; // 0-6 for weekly (0 = Sunday)

  // Threshold Settings
  lowConversionThreshold: number; // percentage
  lowEngagementThreshold: number; // percentage

  // Quiet Hours
  enableQuietHours: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format

  // Preferences
  includeCharts: boolean;
  includeRecommendations: boolean;
}

export interface NotificationTrigger {
  id: string;
  type: "conversion" | "digest" | "threshold" | "milestone";
  campaignId?: string;
  campaignName?: string;
  triggeredAt: string;
  read: boolean;
  data: any;
}

export interface EmailTemplate {
  type: "conversion" | "digest" | "threshold" | "milestone";
  subject: string;
  previewText: string;
  data: any;
}

export const defaultNotificationSettings: NotificationSettings = {
  email: "",
  enableNotifications: true,
  conversionAlerts: true,
  performanceDigests: true,
  thresholdAlerts: true,
  campaignMilestones: true,
  digestFrequency: "daily",
  digestTime: "09:00",
  digestDays: [1, 2, 3, 4, 5], // Monday-Friday
  lowConversionThreshold: 1.0,
  lowEngagementThreshold: 10.0,
  enableQuietHours: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  includeCharts: true,
  includeRecommendations: true,
};
