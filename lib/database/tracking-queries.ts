import { nanoid } from "nanoid";
import { getDatabase } from "./connection";

// ==================== TYPES ====================

export interface Campaign {
  id: string;
  name: string;
  message: string;
  company_name: string;
  created_at: string;
  status: "active" | "paused" | "completed";
}

export interface Recipient {
  id: string;
  campaign_id: string;
  tracking_id: string;
  name: string;
  lastname: string;
  address?: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Event {
  id: string;
  tracking_id: string;
  event_type: "page_view" | "qr_scan" | "button_click" | "form_view" | "external_link";
  event_data?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Conversion {
  id: string;
  tracking_id: string;
  conversion_type: "form_submission" | "appointment_booked" | "call_initiated" | "download";
  conversion_data?: string;
  created_at: string;
}

// ==================== CAMPAIGNS ====================

/**
 * Create a new campaign
 */
export function createCampaign(data: {
  name: string;
  message: string;
  companyName: string;
}): Campaign {
  const db = getDatabase();
  const id = nanoid(16);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO campaigns (id, name, message, company_name, created_at, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  stmt.run(id, data.name, data.message, data.companyName, created_at);

  return {
    id,
    name: data.name,
    message: data.message,
    company_name: data.companyName,
    created_at,
    status: "active",
  };
}

/**
 * Get campaign by ID
 */
export function getCampaignById(id: string): Campaign | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM campaigns WHERE id = ?");
  return stmt.get(id) as Campaign | null;
}

/**
 * Get all campaigns
 */
export function getAllCampaigns(): Campaign[] {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC");
  return stmt.all() as Campaign[];
}

/**
 * Update campaign status
 */
export function updateCampaignStatus(
  id: string,
  status: "active" | "paused" | "completed"
): boolean {
  const db = getDatabase();
  const stmt = db.prepare("UPDATE campaigns SET status = ? WHERE id = ?");
  const result = stmt.run(status, id);
  return result.changes > 0;
}

// ==================== RECIPIENTS ====================

/**
 * Create a new recipient with tracking ID
 */
export function createRecipient(data: {
  campaignId: string;
  name: string;
  lastname: string;
  address?: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
}): Recipient {
  const db = getDatabase();
  const id = nanoid(16);
  const tracking_id = nanoid(12);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO recipients (
      id, campaign_id, tracking_id, name, lastname,
      address, city, zip, email, phone, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.campaignId,
    tracking_id,
    data.name,
    data.lastname,
    data.address || null,
    data.city || null,
    data.zip || null,
    data.email || null,
    data.phone || null,
    created_at
  );

  return {
    id,
    campaign_id: data.campaignId,
    tracking_id,
    name: data.name,
    lastname: data.lastname,
    address: data.address,
    city: data.city,
    zip: data.zip,
    email: data.email,
    phone: data.phone,
    created_at,
  };
}

/**
 * Get recipient by tracking ID
 */
export function getRecipientByTrackingId(trackingId: string): Recipient | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM recipients WHERE tracking_id = ?");
  return stmt.get(trackingId) as Recipient | null;
}

/**
 * Get all recipients for a campaign
 */
export function getRecipientsByCampaign(campaignId: string): Recipient[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM recipients WHERE campaign_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(campaignId) as Recipient[];
}

// ==================== EVENTS ====================

/**
 * Track an event
 */
export function trackEvent(data: {
  trackingId: string;
  eventType: Event["event_type"];
  eventData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Event {
  const db = getDatabase();
  const id = nanoid(16);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO events (id, tracking_id, event_type, event_data, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const eventDataJson = data.eventData ? JSON.stringify(data.eventData) : null;

  stmt.run(
    id,
    data.trackingId,
    data.eventType,
    eventDataJson,
    data.ipAddress || null,
    data.userAgent || null,
    created_at
  );

  return {
    id,
    tracking_id: data.trackingId,
    event_type: data.eventType,
    event_data: eventDataJson || undefined,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    created_at,
  };
}

/**
 * Get all events for a tracking ID
 */
export function getEventsByTrackingId(trackingId: string): Event[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM events WHERE tracking_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(trackingId) as Event[];
}

/**
 * Get event count by type for a tracking ID
 */
export function getEventCountByType(
  trackingId: string,
  eventType: Event["event_type"]
): number {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM events WHERE tracking_id = ? AND event_type = ?"
  );
  const result = stmt.get(trackingId, eventType) as { count: number };
  return result.count;
}

// ==================== CONVERSIONS ====================

/**
 * Track a conversion
 */
export function trackConversion(data: {
  trackingId: string;
  conversionType: Conversion["conversion_type"];
  conversionData?: Record<string, unknown>;
}): Conversion {
  const db = getDatabase();
  const id = nanoid(16);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO conversions (id, tracking_id, conversion_type, conversion_data, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const conversionDataJson = data.conversionData
    ? JSON.stringify(data.conversionData)
    : null;

  stmt.run(
    id,
    data.trackingId,
    data.conversionType,
    conversionDataJson,
    created_at
  );

  return {
    id,
    tracking_id: data.trackingId,
    conversion_type: data.conversionType,
    conversion_data: conversionDataJson || undefined,
    created_at,
  };
}

/**
 * Get all conversions for a tracking ID
 */
export function getConversionsByTrackingId(trackingId: string): Conversion[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM conversions WHERE tracking_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(trackingId) as Conversion[];
}

/**
 * Check if tracking ID has converted
 */
export function hasConverted(trackingId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM conversions WHERE tracking_id = ?"
  );
  const result = stmt.get(trackingId) as { count: number };
  return result.count > 0;
}

// ==================== ANALYTICS ====================

/**
 * Get campaign analytics
 */
export interface CampaignAnalytics {
  campaign: Campaign;
  totalRecipients: number;
  totalPageViews: number;
  uniqueVisitors: number;
  totalConversions: number;
  conversionRate: number;
}

export function getCampaignAnalytics(campaignId: string): CampaignAnalytics | null {
  const db = getDatabase();
  const campaign = getCampaignById(campaignId);

  if (!campaign) return null;

  // Total recipients
  const recipientsStmt = db.prepare(
    "SELECT COUNT(*) as count FROM recipients WHERE campaign_id = ?"
  );
  const { count: totalRecipients } = recipientsStmt.get(campaignId) as { count: number };

  // Total page views
  const pageViewsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE tracking_id IN (
      SELECT tracking_id FROM recipients WHERE campaign_id = ?
    ) AND event_type = 'page_view'
  `);
  const { count: totalPageViews } = pageViewsStmt.get(campaignId) as { count: number };

  // Unique visitors (distinct tracking_ids with page_view events)
  const uniqueVisitorsStmt = db.prepare(`
    SELECT COUNT(DISTINCT tracking_id) as count FROM events
    WHERE tracking_id IN (
      SELECT tracking_id FROM recipients WHERE campaign_id = ?
    ) AND event_type = 'page_view'
  `);
  const { count: uniqueVisitors } = uniqueVisitorsStmt.get(campaignId) as { count: number };

  // Total conversions
  const conversionsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM conversions
    WHERE tracking_id IN (
      SELECT tracking_id FROM recipients WHERE campaign_id = ?
    )
  `);
  const { count: totalConversions } = conversionsStmt.get(campaignId) as { count: number };

  // Conversion rate
  const conversionRate = totalRecipients > 0
    ? (totalConversions / totalRecipients) * 100
    : 0;

  return {
    campaign,
    totalRecipients,
    totalPageViews,
    uniqueVisitors,
    totalConversions,
    conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Get recipient journey (all events and conversions)
 */
export interface RecipientJourney {
  recipient: Recipient;
  events: Event[];
  conversions: Conversion[];
  pageViews: number;
  hasConverted: boolean;
}

export function getRecipientJourney(trackingId: string): RecipientJourney | null {
  const recipient = getRecipientByTrackingId(trackingId);

  if (!recipient) return null;

  const events = getEventsByTrackingId(trackingId);
  const conversions = getConversionsByTrackingId(trackingId);
  const pageViews = getEventCountByType(trackingId, "page_view");

  return {
    recipient,
    events,
    conversions,
    pageViews,
    hasConverted: conversions.length > 0,
  };
}
