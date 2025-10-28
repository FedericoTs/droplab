# DropLab Platform Transformation Plan

**Master Planning Document - Single Source of Truth**

**Last Updated:** October 28, 2025
**Status:** Planning Phase → Implementation Ready
**Target Launch:** 6-8 weeks from start
**Version:** 1.0

---

## 📋 Document Purpose

This is the **MASTER TRANSFORMATION PLAN** for DropLab. All development, feature planning, and architectural decisions should reference this document.

**Rules:**
- ✅ This is the ONLY planning document
- ✅ Update this document as you progress (mark tasks complete)
- ✅ Add new tasks/discoveries to relevant sections
- ❌ Do NOT create separate planning documents
- ❌ Do NOT make major architectural decisions without updating this plan

---

## 🎯 Executive Summary

### Vision Transformation

**FROM:** AI marketing automation for multi-store retail campaigns
**TO:** Universal direct mail SaaS with digital-level analytics

### Core Value Proposition

*"The only direct mail platform where you find your audience (Data Axle), create AI campaigns, send mail (PostGrid), and track every conversion - all in one place."*

### Key Differentiators

1. **Built-in Audience Targeting** - Data Axle integration with FREE count API
2. **AI-First Creative** - Gemini backgrounds ($0.039, 3-4s) + GPT-4 copywriting
3. **Digital-Level Attribution** - QR tracking → landing pages → call tracking → conversions
4. **End-to-End Platform** - No need for external tools

### Success Metrics

**Technical:**
- [ ] Multi-tenant Supabase database operational
- [ ] Data Axle real-time counts working (<500ms)
- [ ] PostGrid mail fulfillment integrated
- [ ] Stripe subscriptions processing
- [ ] End-to-end test: Signup → Target audience → Create DM → Send mail → Track conversion

**Business:**
- [ ] 50 beta users in first month
- [ ] $5K MRR by Month 2
- [ ] <5% churn rate
- [ ] 60%+ onboarding completion rate

**User Experience:**
- [ ] Signup to first mail sent in <10 minutes
- [ ] 95% of campaigns generate mail within 24 hours
- [ ] Zero database-related user complaints

---

## 🏗️ Architecture Overview

### Current State (Before Transformation)

```
DropLab Platform (Retail-Focused)
├── Next.js 15 + React 19 + TypeScript
├── SQLite Database (dm-tracking.db)
├── 316 TypeScript files
├── 17+ database tables
├── Features:
│   ✅ AI Copywriting (GPT-4)
│   ✅ AI Backgrounds (Gemini 2.5 Flash)
│   ✅ DM Creative Builder (Fabric.js canvas)
│   ✅ Template System (reusable DM templates)
│   ✅ Batch Processing (BullMQ + Redis)
│   ✅ Landing Pages (dynamic with tracking)
│   ✅ Analytics Dashboard (QR scans, conversions)
│   ✅ Call Tracking (ElevenLabs integration)
│   ✅ Brand Intelligence (website analyzer)
│   🅿️ Retail Module (store management, performance matrix)
│   🅿️ Campaign Planning (AI-driven recommendations)
│   🅿️ Store Groups (multi-location targeting)
└── Limitations:
    ❌ Single-tenant (no user authentication)
    ❌ Local database (can't deploy to serverless)
    ❌ No contact sourcing (users bring own lists)
    ❌ No printing fulfillment (PDF download only)
    ❌ No billing system
```

### Target State (After Transformation)

```
DropLab SaaS Platform (Universal Direct Mail)
├── Next.js 15 + React 19 + TypeScript
├── Supabase PostgreSQL (multi-tenant with RLS)
├── ~350 TypeScript files (40+ new, 6 deprecated)
├── 25+ database tables (8 new)
├── Features:
│   ✅ All existing AI features (preserved)
│   ✅ Multi-tenant authentication (Supabase Auth)
│   ✅ Audience Targeting (Data Axle - 250M+ contacts)
│   ✅ Printing Fulfillment (PostGrid API)
│   ✅ Subscription Billing (Stripe)
│   ✅ Usage Metering (contacts + mail pieces)
│   ✅ Saved Audiences (reusable filters)
│   ✅ Contact Management (purchased lists)
│   🅿️ Retail Module (hidden, can reactivate)
│   🆕 User Dashboard (account overview)
│   🆕 Onboarding Flow (5-minute setup)
└── Infrastructure:
    ✅ Serverless deployment (Vercel)
    ✅ Row-Level Security (data isolation)
    ✅ Real-time subscriptions (Supabase)
    ✅ Background jobs (BullMQ)
```

---

## 📊 Feature Matrix

### Features to KEEP (95% of codebase)

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **AI Copywriting** | ✅ Keep as-is | `/copywriting` | Core differentiator |
| **AI Backgrounds** | ✅ Keep as-is | `lib/ai/openai-v2.ts` | Gemini integration working |
| **DM Creative Builder** | ✅ Keep, enhance | `/dm-creative` | Add PostGrid integration |
| **Template System** | ✅ Keep as-is | `/templates` | Template library functional |
| **Batch Processing** | ✅ Keep as-is | `lib/queue/` | BullMQ + Redis working |
| **Landing Pages** | ✅ Keep as-is | `/lp/[trackingId]` | QR tracking working |
| **Analytics Dashboard** | ✅ Keep, enhance | `/analytics` | Add user filtering |
| **Call Tracking** | ✅ Keep as-is | `/cc-operations` | ElevenLabs integration |
| **Brand Intelligence** | ✅ Keep as-is | `/settings` (Brand tab) | Website analyzer working |
| **QR Code Generation** | ✅ Keep as-is | `lib/qr-generator.ts` | Core tracking feature |

### Features to DEPRECATE (Hide, Not Delete)

| Feature | Action | Location | Reason |
|---------|--------|----------|--------|
| **Retail Module** | 🅿️ Hide from nav | `/retail/*` | Too niche, can reactivate later |
| **Performance Matrix** | 🅿️ Hide from nav | `/campaigns/matrix` | Retail-specific |
| **Planning Workspace** | 🅿️ Hide from nav | `/campaigns/planning` | Premature, add post-launch |
| **Store Groups** | 🅿️ Hide from nav | `/store-groups` | Retail-specific |

**Implementation:**
- Don't delete code or tables
- Remove from sidebar navigation
- Add feature flag: `ENABLE_RETAIL_MODULE=false`
- Document reactivation process

### Features to ADD (New Development)

| Feature | Priority | Timeline | Dependencies |
|---------|----------|----------|--------------|
| **Supabase Database** | 🔥 Critical | Week 1-2 | None (foundation) |
| **Authentication** | 🔥 Critical | Week 2 | Supabase setup |
| **Data Axle Integration** | 🔥 Critical | Week 2-3 | Auth complete |
| **Audience Targeting UI** | 🔥 Critical | Week 3 | Data Axle API |
| **PostGrid Fulfillment** | 🔥 Critical | Week 3-4 | Auth complete |
| **Stripe Billing** | 🔥 Critical | Week 4-5 | Auth + usage tracking |
| **User Dashboard** | 🔶 High | Week 5 | Auth complete |
| **Onboarding Flow** | 🔶 High | Week 5 | Auth + dashboard |
| **Contact Management** | 🔶 High | Week 4 | Data Axle integration |
| **Saved Audiences** | 🔷 Medium | Week 6 | Data Axle + database |
| **Address Validation** | 🔷 Medium | Post-launch | Smarty API |
| **Geographic Targeting** | ⚪ Low | Post-launch | Data Axle geo filters |

---

## 🗄️ Database Transformation Strategy

### Phase 1: Abstraction Layer (Week 1, Days 1-3)

**Goal:** Enable database switching without rewriting queries

**Status:** ⬜ Not Started

#### Task 1.1: Create Database Interface

**File:** `lib/database/client-interface.ts`

```typescript
export interface DatabaseClient {
  // Campaign operations
  getAllCampaigns(userId?: string): Promise<Campaign[]>;
  getCampaignById(id: string, userId?: string): Promise<Campaign | null>;
  createCampaign(data: CampaignInput, userId: string): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>, userId: string): Promise<Campaign>;
  deleteCampaign(id: string, userId: string): Promise<void>;

  // Recipient operations
  getRecipientsByCampaign(campaignId: string, userId?: string): Promise<Recipient[]>;
  createRecipient(data: RecipientInput, userId: string): Promise<Recipient>;
  bulkCreateRecipients(data: RecipientInput[], userId: string): Promise<Recipient[]>;

  // Analytics operations
  trackEvent(event: AnalyticsEvent): Promise<void>;
  getCampaignStats(campaignId: string, userId?: string): Promise<CampaignStats>;
  getOverviewStats(userId: string): Promise<OverviewStats>;

  // Template operations
  getAllTemplates(userId?: string): Promise<DMTemplate[]>;
  getTemplateById(id: string, userId?: string): Promise<DMTemplate | null>;
  createTemplate(data: TemplateInput, userId: string): Promise<DMTemplate>;

  // Landing page operations
  getLandingPageByTrackingId(trackingId: string): Promise<LandingPageData | null>;
  createLandingPage(data: LandingPageInput): Promise<LandingPageData>;

  // Brand profile operations
  getBrandProfile(userId: string): Promise<BrandProfile | null>;
  upsertBrandProfile(data: BrandProfileInput, userId: string): Promise<BrandProfile>;

  // User operations (new for Supabase)
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;

  // Subscription operations (new for billing)
  getSubscription(userId: string): Promise<Subscription | null>;
  updateSubscription(userId: string, data: SubscriptionInput): Promise<Subscription>;

  // Usage tracking (new for billing)
  trackUsage(userId: string, type: 'contacts' | 'mail', quantity: number): Promise<void>;
  getUsage(userId: string, period: 'month' | 'billing_cycle'): Promise<UsageData>;
}
```

**Checklist:**
- [ ] Define complete interface with all methods
- [ ] Add TypeScript types for all parameters/returns
- [ ] Document each method with JSDoc comments
- [ ] Add userId parameter to all relevant methods (for RLS)

---

#### Task 1.2: Implement SQLite Client (Wrapper)

**File:** `lib/database/sqlite-client.ts`

**Goal:** Wrap existing better-sqlite3 queries in the interface

```typescript
import Database from 'better-sqlite3';
import { DatabaseClient } from './client-interface';

export class SQLiteClient implements DatabaseClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
  }

  async getAllCampaigns(userId?: string): Promise<Campaign[]> {
    // Wrap existing synchronous query
    const query = userId
      ? 'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM campaigns ORDER BY created_at DESC';

    const rows = userId
      ? this.db.prepare(query).all(userId)
      : this.db.prepare(query).all();

    return Promise.resolve(rows as Campaign[]);
  }

  async createCampaign(data: CampaignInput, userId: string): Promise<Campaign> {
    const id = nanoid();
    this.db.prepare(`
      INSERT INTO campaigns (id, user_id, name, message, company_name, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, userId, data.name, data.message, data.companyName);

    return this.getCampaignById(id, userId);
  }

  // ... implement all other methods
}
```

**Checklist:**
- [ ] Wrap all campaign queries
- [ ] Wrap all recipient queries
- [ ] Wrap all analytics queries
- [ ] Wrap all template queries
- [ ] Wrap all landing page queries
- [ ] Wrap all brand profile queries
- [ ] Add user_id to all INSERT/UPDATE queries
- [ ] Test all methods with existing data

**Estimated queries to wrap:** ~60-80 across all modules

---

#### Task 1.3: Update Database Connection

**File:** `lib/database/connection.ts`

```typescript
import { SQLiteClient } from './sqlite-client';
import { SupabaseClient } from './supabase-client';
import { DatabaseClient } from './client-interface';

/**
 * Get database client based on environment
 * Switch with NEXT_PUBLIC_SUPABASE_URL environment variable
 */
export function getDatabase(): DatabaseClient {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Fallback to SQLite for local development
  return new SQLiteClient(process.cwd() + '/dm-tracking.db');
}
```

**Checklist:**
- [ ] Implement environment-based switching
- [ ] Add TypeScript types
- [ ] Test switching between SQLite and Supabase
- [ ] Document usage in README

---

### Phase 2: Supabase Setup (Week 1, Days 4-7)

**Status:** ⬜ Not Started

#### Task 2.1: Create Supabase Project

**Steps:**
1. Go to https://supabase.com
2. Create account / login
3. Click "New Project"
4. Settings:
   - **Organization:** DropLab
   - **Name:** droplab-production
   - **Database Password:** Generate strong password (save to password manager)
   - **Region:** Choose closest to target users (e.g., US East for US market)
   - **Pricing Plan:** Free (upgrade to Pro when needed)

**Checklist:**
- [ ] Account created
- [ ] Project created
- [ ] Database password saved securely
- [ ] Project URL copied (https://xyz.supabase.co)
- [ ] API keys copied (anon public, service role secret)

---

#### Task 2.2: Schema Migration (SQLite → PostgreSQL)

**File:** `lib/database/supabase-schema.sql`

**Critical Changes:**

| SQLite | PostgreSQL | Reason |
|--------|------------|--------|
| `TEXT PRIMARY KEY` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Better for distributed systems |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` or `BIGSERIAL` | PostgreSQL standard |
| `TEXT NOT NULL DEFAULT (datetime('now'))` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | Timezone-aware timestamps |
| `INTEGER DEFAULT 1` (for boolean) | `BOOLEAN DEFAULT true` | Native boolean type |
| `TEXT` (for JSON) | `JSONB` | Native JSON with indexing |

**Schema Migration Script:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (NEW - required for multi-tenancy)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  credits DECIMAL(10,2) DEFAULT 0,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'trialing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table (MODIFIED - add user_id)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'archived'))
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Recipients table (MODIFIED - add user_id)
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tracking_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(255),
  zip VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipients_user_id ON recipients(user_id);
CREATE INDEX idx_recipients_campaign_id ON recipients(campaign_id);
CREATE INDEX idx_recipients_tracking_id ON recipients(tracking_id);

-- DM Templates table (MODIFIED - add user_id)
CREATE TABLE dm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  canvas_session_id VARCHAR(255),
  campaign_template_id UUID,
  name VARCHAR(255) NOT NULL,
  canvas_json TEXT NOT NULL,
  background_image TEXT NOT NULL,
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  preview_image TEXT,
  variable_mappings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dm_templates_user_id ON dm_templates(user_id);
CREATE INDEX idx_dm_templates_campaign_id ON dm_templates(campaign_id);

-- Landing Pages table (MODIFIED - add user_id)
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tracking_id VARCHAR(50) UNIQUE NOT NULL REFERENCES recipients(tracking_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  page_data TEXT NOT NULL,
  landing_page_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX idx_landing_pages_tracking_id ON landing_pages(tracking_id);

-- Events table (tracking - MODIFIED)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(50) NOT NULL REFERENCES recipients(tracking_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK(event_type IN ('page_view', 'qr_scan', 'button_click', 'form_view', 'external_link')),
  event_data TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_tracking_id ON events(tracking_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Conversions table (MODIFIED)
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(50) NOT NULL REFERENCES recipients(tracking_id) ON DELETE CASCADE,
  conversion_type VARCHAR(50) NOT NULL CHECK(conversion_type IN ('form_submission', 'appointment_booked', 'call_initiated', 'download')),
  conversion_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversions_tracking_id ON conversions(tracking_id);
CREATE INDEX idx_conversions_type ON conversions(conversion_type);

-- Brand Profiles table (MODIFIED - add user_id)
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  brand_voice TEXT,
  tone TEXT,
  key_phrases TEXT,
  brand_values TEXT,
  target_audience TEXT,
  industry VARCHAR(255),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  logo_asset_id VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#1E3A8A',
  secondary_color VARCHAR(7) DEFAULT '#FF6B35',
  accent_color VARCHAR(7) DEFAULT '#10B981',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  heading_font VARCHAR(255) DEFAULT 'Inter',
  body_font VARCHAR(255) DEFAULT 'Open Sans',
  landing_page_template VARCHAR(255) DEFAULT 'professional',
  website_url TEXT,
  last_updated_at TIMESTAMPTZ
);

CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- NEW TABLES FOR SAAS FEATURES --

-- Saved Audiences (NEW)
CREATE TABLE saved_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  last_count INTEGER,
  last_count_updated_at TIMESTAMPTZ,
  total_contacts_purchased INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_audiences_user_id ON saved_audiences(user_id);
CREATE INDEX idx_saved_audiences_filters ON saved_audiences USING GIN (filters);

-- Contact Purchases (NEW - track Data Axle purchases)
CREATE TABLE contact_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  audience_id UUID REFERENCES saved_audiences(id),
  filters JSONB NOT NULL,
  contact_count INTEGER NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_purchases_user_id ON contact_purchases(user_id);
CREATE INDEX idx_contact_purchases_order_id ON contact_purchases(order_id);
CREATE INDEX idx_contact_purchases_created_at ON contact_purchases(created_at DESC);

-- Subscriptions (NEW - Stripe integration)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Usage Tracking (NEW - for billing)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_type VARCHAR(50) NOT NULL CHECK(usage_type IN ('contacts_purchased', 'mail_sent', 'ai_generation', 'api_call')),
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_type ON usage_logs(usage_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Fulfillment Orders (NEW - PostGrid integration)
CREATE TABLE fulfillment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  postgrid_order_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  mail_pieces_count INTEGER NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_fulfillment_orders_user_id ON fulfillment_orders(user_id);
CREATE INDEX idx_fulfillment_orders_campaign_id ON fulfillment_orders(campaign_id);
CREATE INDEX idx_fulfillment_orders_status ON fulfillment_orders(status);

-- Keep existing batch processing tables (add user_id)
-- Keep existing retail tables (for future reactivation)
-- Keep existing ElevenLabs call tracking tables
```

**Checklist:**
- [ ] Create SQL file with complete schema
- [ ] Test schema in Supabase SQL editor
- [ ] Verify all foreign keys work
- [ ] Verify all indexes created
- [ ] Document schema differences from SQLite

---

#### Task 2.3: Row-Level Security (RLS) Policies

**Critical for Multi-Tenancy:** Users must only see their own data.

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_orders ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Recipients policies
CREATE POLICY "Users can view own recipients"
  ON recipients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recipients"
  ON recipients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Landing pages are PUBLIC (accessed by tracking ID, not user)
ALTER TABLE landing_pages DISABLE ROW LEVEL SECURITY;

-- Events are PUBLIC (tracking doesn't require auth)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Conversions are PUBLIC (tracking doesn't require auth)
ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;

-- DM Templates policies
CREATE POLICY "Users can view own templates"
  ON dm_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON dm_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brand Profiles policies
CREATE POLICY "Users can view own brand profile"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own brand profile"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profile"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Saved Audiences policies
CREATE POLICY "Users can view own audiences"
  ON saved_audiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audiences"
  ON saved_audiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audiences"
  ON saved_audiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audiences"
  ON saved_audiences FOR DELETE
  USING (auth.uid() = user_id);

-- Contact Purchases policies
CREATE POLICY "Users can view own purchases"
  ON contact_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
  ON contact_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Usage Logs policies
CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fulfillment Orders policies
CREATE POLICY "Users can view own orders"
  ON fulfillment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON fulfillment_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Checklist:**
- [ ] Enable RLS on all user-specific tables
- [ ] Create SELECT policies for all tables
- [ ] Create INSERT policies for all tables
- [ ] Create UPDATE policies where needed
- [ ] Create DELETE policies where needed
- [ ] Disable RLS for public tracking tables
- [ ] Test: User A cannot see User B's data
- [ ] Test: Public tracking works without auth

---

#### Task 2.4: Implement Supabase Client

**File:** `lib/database/supabase-client.ts`

```typescript
import { createClient, SupabaseClient as SupabaseType } from '@supabase/supabase-js';
import { DatabaseClient } from './client-interface';
import { Campaign, Recipient, /* ... other types */ } from './types';

export class SupabaseClient implements DatabaseClient {
  private supabase: SupabaseType;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getAllCampaigns(userId?: string): Promise<Campaign[]> {
    const query = this.supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    // RLS will automatically filter by user_id
    // No need to add .eq('user_id', userId) - RLS handles it!

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get campaigns: ${error.message}`);

    return data as Campaign[];
  }

  async getCampaignById(id: string, userId?: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  async createCampaign(data: CampaignInput, userId: string): Promise<Campaign> {
    const { data: campaign, error } = await this.supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: data.name,
        message: data.message,
        company_name: data.companyName,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create campaign: ${error.message}`);

    return campaign as Campaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>, userId: string): Promise<Campaign> {
    const { data: campaign, error } = await this.supabase
      .from('campaigns')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update campaign: ${error.message}`);

    return campaign as Campaign;
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
  }

  // ... implement all other methods from DatabaseClient interface

  // Helper: Get current user ID from auth session
  async getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.user?.id || null;
  }
}
```

**Checklist:**
- [ ] Implement all DatabaseClient methods
- [ ] Use `.select()` for reads
- [ ] Use `.insert()` for creates
- [ ] Use `.update()` for updates
- [ ] Use `.delete()` for deletes
- [ ] Add proper error handling for all queries
- [ ] Let RLS handle user_id filtering (don't add manual filters)
- [ ] Test all CRUD operations
- [ ] Test with multiple users (data isolation)

---

#### Task 2.5: Data Migration (SQLite → Supabase)

**Goal:** Move existing demo/test data to Supabase

**File:** `scripts/migrate-to-supabase.ts`

```typescript
import { SQLiteClient } from '@/lib/database/sqlite-client';
import { SupabaseClient } from '@/lib/database/supabase-client';

async function migrate() {
  const sqlite = new SQLiteClient('./dm-tracking.db');
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for migration
  );

  // Create a default user for existing data
  const defaultUser = await supabase.createUser({
    email: 'demo@droplab.com',
    fullName: 'Demo User',
    companyName: 'DropLab Demo'
  });

  console.log('Migrating campaigns...');
  const campaigns = await sqlite.getAllCampaigns();
  for (const campaign of campaigns) {
    await supabase.createCampaign({
      name: campaign.name,
      message: campaign.message,
      companyName: campaign.company_name
    }, defaultUser.id);
  }

  console.log('Migrating recipients...');
  // ... migrate recipients

  console.log('Migrating templates...');
  // ... migrate templates

  console.log('Migration complete!');
}

migrate().catch(console.error);
```

**Checklist:**
- [ ] Export all data from SQLite
- [ ] Create default user in Supabase
- [ ] Migrate campaigns (link to default user)
- [ ] Migrate recipients (link to campaigns + default user)
- [ ] Migrate templates (link to default user)
- [ ] Migrate landing pages
- [ ] Migrate brand profiles (link to default user)
- [ ] Verify data integrity after migration
- [ ] Test application with migrated data

---

### Phase 3: Authentication (Week 2, Days 8-10)

**Status:** ⬜ Not Started

#### Task 3.1: Install Supabase Auth

```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Checklist:**
- [ ] Install dependencies
- [ ] Verify package versions compatible with Next.js 15

---

#### Task 3.2: Configure Supabase Auth

**File:** `lib/supabase/server.ts` (Server-side)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie set errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie remove errors
          }
        },
      },
    }
  );
}
```

**File:** `lib/supabase/client.ts` (Client-side)

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Checklist:**
- [ ] Create server-side Supabase client
- [ ] Create client-side Supabase client
- [ ] Test both clients work correctly

---

#### Task 3.3: Create Auth Pages

**File:** `app/auth/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Logged in successfully!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Login to DropLab</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </Card>
    </div>
  );
}
```

**File:** `app/auth/signup/page.tsx`

(Similar structure, use `supabase.auth.signUp()`)

**Checklist:**
- [ ] Create login page
- [ ] Create signup page
- [ ] Create forgot password page
- [ ] Add form validation
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test email/password signup
- [ ] Test OAuth providers (optional: Google, GitHub)

---

#### Task 3.4: Middleware for Route Protection

**File:** `middleware.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if accessing protected routes without auth
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - lp/ (public landing pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|lp).*)',
  ],
};
```

**Checklist:**
- [ ] Create middleware file
- [ ] Configure protected routes
- [ ] Allow public access to landing pages (/lp/*)
- [ ] Allow public access to auth pages
- [ ] Test: Unauthenticated users redirected to login
- [ ] Test: Authenticated users can access dashboard
- [ ] Test: Authenticated users redirected from /auth/* to dashboard

---

#### Task 3.5: User Context Provider

**File:** `lib/contexts/auth-context.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Checklist:**
- [ ] Create auth context
- [ ] Add to root layout
- [ ] Create useAuth hook
- [ ] Test: User data available in components
- [ ] Test: Sign out functionality

---

### Phase 4: Data Axle Integration (Week 2-3, Days 11-17)

**Status:** ⬜ Not Started

**Reference:** See `docs/DATA_AXLE_INTEGRATION_GUIDE.md` for complete details

#### Task 4.1: Setup Data Axle Account

**Checklist:**
- [ ] Sign up: https://platform.data-axle.com/auth_time/signup
- [ ] Activate account via email
- [ ] Generate API token
- [ ] Test authentication with curl
- [ ] Add token to `.env.local`
- [ ] Contact partnerships team for reseller pricing

---

#### Task 4.2: Create Data Axle Client

**File:** `lib/contacts/data-axle-client.ts`

(See DATA_AXLE_INTEGRATION_GUIDE.md Section 10 for complete code)

**Checklist:**
- [ ] Implement DataAxleClient class
- [ ] Add rate limiter (150 req/10s)
- [ ] Implement getCount() method (Insights API)
- [ ] Implement purchaseContacts() method (Search API)
- [ ] Implement buildFilterDSL() method
- [ ] Add retry logic with exponential backoff
- [ ] Add error handling
- [ ] Test with sample filters

---

#### Task 4.3: Create API Routes

**Files:**
- `app/api/contacts/count/route.ts`
- `app/api/contacts/purchase/route.ts`

**Checklist:**
- [ ] Create count endpoint (FREE - Insights API)
- [ ] Create purchase endpoint (PAID - Search API)
- [ ] Add authentication checks
- [ ] Add usage tracking (for billing)
- [ ] Add caching for count requests (5 min)
- [ ] Test both endpoints with Postman/curl

---

#### Task 4.4: Build Audience Targeting UI

**File:** `app/campaigns/new/audience/page.tsx`

(See DATA_AXLE_INTEGRATION_GUIDE.md Section 7 for complete code)

**Checklist:**
- [ ] Create page layout
- [ ] Add filter controls (sliders, dropdowns, checkboxes)
- [ ] Add prominent count display (updates real-time)
- [ ] Add cost calculator
- [ ] Implement debouncing (500ms)
- [ ] Add "Save Audience" button
- [ ] Add "Purchase Contacts" button
- [ ] Test real-time count updates
- [ ] Test purchase flow end-to-end

---

#### Task 4.5: Saved Audiences Feature

**Database:**
Already created in Supabase schema (saved_audiences table)

**Files:**
- `app/audiences/page.tsx` - Audience library
- `app/api/audiences/route.ts` - CRUD endpoints

**Checklist:**
- [ ] Create audience library page
- [ ] Add "Save Audience" functionality
- [ ] Add "Load Audience" functionality
- [ ] Show historical count trends
- [ ] Show performance metrics (conversion rate)
- [ ] Test save/load/delete operations

---

### Phase 5: PostGrid Fulfillment (Week 3-4, Days 18-24)

**Status:** ⬜ Not Started

#### Task 5.1: Setup PostGrid Account

**Steps:**
1. Sign up: https://www.postgrid.com/signup
2. Pricing: $250/mo for 500 pieces
3. Generate API key from dashboard
4. Review documentation: https://docs.postgrid.com

**Checklist:**
- [ ] Account created
- [ ] API key generated
- [ ] Test API with sample request
- [ ] Understand pricing structure
- [ ] Add API key to `.env.local`

---

#### Task 5.2: Create PostGrid Client

**File:** `lib/printing/postgrid-client.ts`

```typescript
export interface PostGridAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  provinceOrState: string;
  postalOrZip: string;
  countryCode: string;
}

export interface PostGridMailPiece {
  to: PostGridAddress;
  from: PostGridAddress;
  size: 'postcard_4x6' | 'postcard_6x9' | 'letter';
  pdfUrl?: string; // URL to hosted PDF
  htmlContent?: string; // Or inline HTML
  mailType: 'usps_first_class' | 'usps_standard';
}

export class PostGridClient {
  private apiKey: string;
  private baseURL = 'https://api.postgrid.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createMailPiece(data: PostGridMailPiece): Promise<any> {
    const response = await fetch(`${this.baseURL}/letters`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`PostGrid error: ${response.statusText}`);
    }

    return response.json();
  }

  async getBatchStatus(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/letters/${orderId}`, {
      headers: { 'x-api-key': this.apiKey }
    });

    return response.json();
  }

  // ... more methods
}
```

**Checklist:**
- [ ] Implement PostGridClient class
- [ ] Add createMailPiece() method
- [ ] Add getBatchStatus() method
- [ ] Add cancelOrder() method
- [ ] Add webhook setup method
- [ ] Test single mail piece creation
- [ ] Test batch mailing

---

#### Task 5.3: Update DM Creative Flow

**File:** `app/dm-creative/page.tsx`

**Changes:**
- Add "Send via Mail" button (in addition to "Download PDF")
- Show modal: "Send now ($0.68/piece) or Schedule for later?"
- Create PostGrid order
- Store order in fulfillment_orders table
- Show confirmation with tracking

**Checklist:**
- [ ] Add "Send via Mail" button
- [ ] Create send confirmation modal
- [ ] Integrate with PostGrid API
- [ ] Store order in database
- [ ] Update UI to show order status
- [ ] Test end-to-end: Create DM → Send via PostGrid

---

#### Task 5.4: Fulfillment Dashboard

**File:** `app/fulfillment/page.tsx`

**Features:**
- Order history (all PostGrid orders)
- Status tracking (pending → printing → shipped → delivered)
- Cost summary
- Download proofs

**Checklist:**
- [ ] Create fulfillment dashboard page
- [ ] Show order list with status
- [ ] Add filtering by status
- [ ] Add search by campaign/recipient
- [ ] Show cost breakdown
- [ ] Test with multiple orders

---

#### Task 5.5: Webhook Endpoint

**File:** `app/api/webhooks/postgrid/route.ts`

```typescript
export async function POST(req: Request) {
  const event = await req.json();

  if (event.type === 'mail.delivered') {
    // Update order status in database
    const db = getDatabase();
    await db.updateFulfillmentOrder(event.data.id, {
      status: 'delivered',
      delivered_at: new Date().toISOString()
    });

    // Send notification to user
    // await sendEmail(...)
  }

  return NextResponse.json({ received: true });
}
```

**Checklist:**
- [ ] Create webhook endpoint
- [ ] Handle all PostGrid events (printed, shipped, delivered, failed)
- [ ] Update database on each event
- [ ] Send user notifications
- [ ] Register webhook URL with PostGrid
- [ ] Test with PostGrid webhook simulator

---

### Phase 6: Stripe Billing (Week 4-5, Days 25-31)

**Status:** ⬜ Not Started

#### Task 6.1: Setup Stripe Account

**Steps:**
1. Sign up: https://stripe.com
2. Complete business verification
3. Create products/prices in Stripe Dashboard:
   - Starter: $79/mo
   - Professional: $249/mo
   - Agency: $599/mo
4. Create usage-based pricing for overages
5. Generate API keys

**Checklist:**
- [ ] Account created and verified
- [ ] Products created in Stripe Dashboard
- [ ] Pricing configured
- [ ] API keys generated (test + live)
- [ ] Add keys to `.env.local`

---

#### Task 6.2: Install Stripe SDK

```bash
npm install stripe @stripe/stripe-js
```

**Checklist:**
- [ ] Install dependencies
- [ ] Verify package versions

---

#### Task 6.3: Create Stripe Client

**File:** `lib/billing/stripe-client.ts`

```typescript
import Stripe from 'stripe';

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createCustomer(user: User): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { userId: user.id }
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 14,
    });
  }

  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async trackUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp: number
  ): Promise<Stripe.UsageRecord> {
    return await this.stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      { quantity, timestamp }
    );
  }

  // ... more methods
}
```

**Checklist:**
- [ ] Implement StripeClient class
- [ ] Add createCustomer() method
- [ ] Add createSubscription() method
- [ ] Add createCheckoutSession() method
- [ ] Add trackUsage() method
- [ ] Add cancelSubscription() method
- [ ] Test all methods in test mode

---

#### Task 6.4: Billing Dashboard

**File:** `app/billing/page.tsx`

**Features:**
- Current plan display
- Usage this month (contacts, mail pieces)
- Plan limits and usage bars
- Invoice history
- Upgrade/downgrade buttons
- Cancel subscription button

**Checklist:**
- [ ] Create billing page
- [ ] Show current plan details
- [ ] Show usage meters
- [ ] Show invoice history
- [ ] Add upgrade button (→ Stripe Checkout)
- [ ] Add cancel subscription button
- [ ] Test plan upgrades
- [ ] Test plan downgrades

---

#### Task 6.5: Stripe Webhooks

**File:** `app/api/webhooks/stripe/route.ts`

```typescript
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'customer.subscription.updated':
      // Update subscription in database
      break;
    case 'customer.subscription.deleted':
      // Cancel subscription in database
      break;
    case 'invoice.payment_succeeded':
      // Mark invoice as paid
      break;
    case 'invoice.payment_failed':
      // Send notification, pause account
      break;
  }

  return new Response(JSON.stringify({ received: true }));
}
```

**Checklist:**
- [ ] Create webhook endpoint
- [ ] Handle subscription.updated
- [ ] Handle subscription.deleted
- [ ] Handle invoice.payment_succeeded
- [ ] Handle invoice.payment_failed
- [ ] Register webhook URL in Stripe Dashboard
- [ ] Test with Stripe webhook tester

---

#### Task 6.6: Usage Metering Integration

**Goal:** Track contacts purchased and mail sent for billing

**File:** `lib/billing/usage-tracker.ts`

```typescript
export async function trackContactPurchase(userId: string, quantity: number) {
  const db = getDatabase();

  // Log usage
  await db.trackUsage(userId, 'contacts_purchased', quantity);

  // Send to Stripe (if on metered plan)
  const subscription = await db.getSubscription(userId);
  if (subscription?.metered) {
    const stripe = new StripeClient(process.env.STRIPE_SECRET_KEY!);
    await stripe.trackUsage(
      subscription.stripe_subscription_item_id,
      quantity,
      Date.now()
    );
  }
}

export async function trackMailSent(userId: string, quantity: number) {
  const db = getDatabase();

  await db.trackUsage(userId, 'mail_sent', quantity);

  // Send to Stripe
  const subscription = await db.getSubscription(userId);
  if (subscription?.metered) {
    const stripe = new StripeClient(process.env.STRIPE_SECRET_KEY!);
    await stripe.trackUsage(
      subscription.stripe_subscription_item_id,
      quantity,
      Date.now()
    );
  }
}
```

**Checklist:**
- [ ] Create usage tracker functions
- [ ] Call trackContactPurchase() after Data Axle purchase
- [ ] Call trackMailSent() after PostGrid order
- [ ] Log all usage to database
- [ ] Send usage to Stripe for metered billing
- [ ] Test usage tracking end-to-end

---

### Phase 7: User Experience (Week 5, Days 32-35)

**Status:** ⬜ Not Started

#### Task 7.1: Dashboard Page

**File:** `app/dashboard/page.tsx`

**Features:**
- Welcome message
- Quick stats (campaigns, mail sent, conversions)
- Recent campaigns widget
- Quick action cards
- Recent activity feed

**Checklist:**
- [ ] Create dashboard page
- [ ] Add welcome section
- [ ] Add stats overview cards
- [ ] Add recent campaigns list
- [ ] Add quick actions (New Campaign, View Analytics)
- [ ] Add recent activity feed
- [ ] Test with real user data

---

#### Task 7.2: Onboarding Flow

**File:** `app/onboarding/page.tsx`

**4 Steps:**
1. Welcome (platform overview)
2. Company Profile (brand intelligence)
3. API Keys (PostGrid, optional: OpenAI/Gemini/ElevenLabs)
4. First Campaign (pre-filled template)

**Checklist:**
- [ ] Create onboarding wizard
- [ ] Step 1: Welcome screen
- [ ] Step 2: Company profile (reuse brand intelligence)
- [ ] Step 3: API key setup
- [ ] Step 4: First campaign tutorial
- [ ] Add progress indicator
- [ ] Add skip/back buttons
- [ ] Redirect to dashboard on completion
- [ ] Test complete onboarding flow

---

#### Task 7.3: Updated Navigation

**File:** `components/sidebar.tsx`

**New Structure:**
```
🏠 Dashboard (new)
──────────── CAMPAIGN CREATION ────────────
🎯 Target Audience (new - Data Axle)
✍️ AI Copywriting
📬 DM Creative
📤 Fulfillment (new - PostGrid orders)
──────────── ANALYTICS & TRACKING ────────────
📊 Analytics Dashboard
📞 Call Tracking
──────────── MANAGEMENT ────────────
👥 Audiences (new - saved audiences)
📋 Templates
⚙️ Settings
💳 Billing (new)
```

**Checklist:**
- [ ] Update sidebar with new items
- [ ] Remove retail module items
- [ ] Add icons for new pages
- [ ] Add active state highlighting
- [ ] Add user menu (profile, logout)
- [ ] Test navigation on all pages

---

#### Task 7.4: UI/UX Polish

**Global Improvements:**
- Add loading skeletons
- Add empty states ("No campaigns yet")
- Add error states with retry buttons
- Add toast notifications for all actions
- Add confirmation modals for destructive actions
- Improve mobile responsiveness

**Checklist:**
- [ ] Add loading states to all async operations
- [ ] Add empty states to all list views
- [ ] Add error states with helpful messages
- [ ] Add toast notifications (success/error)
- [ ] Add confirmation modals (delete, cancel)
- [ ] Test on mobile (iPhone, Android)
- [ ] Test on tablet (iPad)
- [ ] Test on desktop (various screen sizes)

---

### Phase 8: Testing & Quality Assurance (Week 6, Days 36-38)

**Status:** ⬜ Not Started

#### Task 8.1: End-to-End Testing

**Test Scenarios:**

1. **New User Signup Flow**
   - [ ] Sign up with email
   - [ ] Verify email
   - [ ] Complete onboarding
   - [ ] Create first campaign
   - [ ] Purchase contacts from Data Axle
   - [ ] Generate DM with AI
   - [ ] Send via PostGrid
   - [ ] View in analytics dashboard

2. **Returning User Flow**
   - [ ] Login
   - [ ] View dashboard
   - [ ] Create new campaign (skip onboarding)
   - [ ] Use saved audience
   - [ ] Send mail
   - [ ] View analytics

3. **Billing Flow**
   - [ ] Start on free trial
   - [ ] Use trial credits
   - [ ] Upgrade to paid plan
   - [ ] Purchase overages
   - [ ] View invoice
   - [ ] Cancel subscription

4. **Multi-User Test**
   - [ ] Create 2 test users
   - [ ] User A creates campaign
   - [ ] User B cannot see User A's campaign (RLS working)
   - [ ] User A can see own campaigns
   - [ ] User B can see own campaigns

---

#### Task 8.2: Performance Testing

**Metrics to Test:**
- [ ] Page load times (<3s for all pages)
- [ ] Data Axle count API (<500ms)
- [ ] Database query times (<100ms for simple queries)
- [ ] Batch processing (1000 recipients in <2 min)
- [ ] Real-time analytics updates (<30s)

**Tools:**
- Lighthouse (Chrome DevTools)
- Vercel Analytics
- Supabase Dashboard (query performance)

---

#### Task 8.3: Security Audit

**Checklist:**
- [ ] RLS policies tested (users can't see each other's data)
- [ ] API keys encrypted in database
- [ ] Environment variables not exposed to client
- [ ] CSRF protection enabled
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (React escapes by default)

---

#### Task 8.4: Browser Compatibility

**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

### Phase 9: Deployment (Week 6, Days 39-42)

**Status:** ⬜ Not Started

#### Task 9.1: Environment Configuration

**Vercel Environment Variables:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (secret)

# Data Axle
DATA_AXLE_API_KEY=your_token (secret)
DATA_AXLE_BASE_URL=https://api.data-axle.com/v1/people
NEXT_PUBLIC_DATA_AXLE_COST_PER_CONTACT=0.15

# PostGrid
POSTGRID_API_KEY=your_token (secret)

# Stripe
STRIPE_SECRET_KEY=sk_live_... (secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (secret)

# OpenAI (optional - for custom keys)
OPENAI_API_KEY=sk-... (secret)

# Gemini (for AI backgrounds)
GEMINI_API_KEY=AIzaSy... (secret)

# ElevenLabs (optional)
ELEVENLABS_API_KEY=... (secret)

# Application
NEXT_PUBLIC_APP_URL=https://droplab.com
```

**Checklist:**
- [ ] Add all environment variables to Vercel
- [ ] Mark sensitive keys as "Secret"
- [ ] Test in staging environment first
- [ ] Verify all API integrations work in production

---

#### Task 9.2: Domain Setup

**Steps:**
1. Purchase domain (e.g., droplab.com)
2. Add domain to Vercel project
3. Configure DNS records
4. Enable SSL (automatic with Vercel)
5. Test: https://droplab.com loads correctly

**Checklist:**
- [ ] Domain purchased
- [ ] Domain added to Vercel
- [ ] DNS configured
- [ ] SSL working
- [ ] www redirect configured

---

#### Task 9.3: Database Optimization

**Supabase Production Checklist:**
- [ ] Review all indexes (add if missing)
- [ ] Enable point-in-time recovery (PITR)
- [ ] Set up daily backups
- [ ] Configure connection pooling
- [ ] Monitor query performance
- [ ] Upgrade to Pro plan if needed (>500MB data)

---

#### Task 9.4: Monitoring Setup

**Tools to Configure:**
- [ ] Vercel Analytics (automatic)
- [ ] Supabase Dashboard (query monitoring)
- [ ] Sentry (error tracking) - optional
- [ ] LogRocket (session replay) - optional

**Key Metrics to Monitor:**
- API response times
- Error rates
- User signups
- Subscription conversions
- Churn rate

---

#### Task 9.5: Deploy to Production

**Deployment Checklist:**
- [ ] Merge all changes to main branch
- [ ] Run final build locally (`npm run build`)
- [ ] Fix any build errors
- [ ] Push to GitHub
- [ ] Vercel auto-deploys from main branch
- [ ] Verify deployment success
- [ ] Test all features in production
- [ ] Monitor error logs for 24 hours

---

### Phase 10: Beta Launch (Week 7+)

**Status:** ⬜ Not Started

#### Task 10.1: Beta User Recruitment

**Target:** 50 beta users

**Channels:**
- [ ] Personal network (10 users)
- [ ] LinkedIn outreach (20 users)
- [ ] Reddit (r/entrepreneur, r/marketing)
- [ ] Product Hunt (soft launch)
- [ ] Direct mail to prospects (meta!)

**Offer:** 50% off lifetime for first 100 users

---

#### Task 10.2: Feedback Collection

**Methods:**
- [ ] In-app feedback widget
- [ ] Post-campaign surveys
- [ ] 1-on-1 user interviews (10 users)
- [ ] Track feature usage (analytics)

**Questions:**
- What's the #1 feature you use most?
- What's missing?
- What's confusing?
- Would you recommend DropLab? (NPS)

---

#### Task 10.3: Iteration Based on Feedback

**Process:**
1. Collect feedback weekly
2. Prioritize top 3 pain points
3. Fix within 1 week
4. Deploy and notify users
5. Repeat

**Checklist:**
- [ ] Week 1 feedback collected
- [ ] Week 1 fixes deployed
- [ ] Week 2 feedback collected
- [ ] Week 2 fixes deployed
- [ ] Week 3 feedback collected
- [ ] Week 3 fixes deployed
- [ ] Week 4 feedback collected
- [ ] Week 4 fixes deployed

---

#### Task 10.4: Public Launch Preparation

**Marketing Assets:**
- [ ] Landing page (marketing site)
- [ ] Demo video (2 min)
- [ ] Product screenshots
- [ ] Case studies (3 beta customers)
- [ ] Pricing page
- [ ] FAQ page
- [ ] Blog post ("Launching DropLab")

**Launch Channels:**
- [ ] Product Hunt
- [ ] Hacker News
- [ ] LinkedIn
- [ ] Twitter/X
- [ ] Email to waitlist

---

## 📁 File Structure Changes

### New Files to Create

```
lib/
├── supabase/
│   ├── server.ts (new)
│   └── client.ts (new)
├── database/
│   ├── client-interface.ts (new)
│   ├── sqlite-client.ts (new)
│   └── supabase-client.ts (new)
├── contacts/
│   ├── data-axle-client.ts (new)
│   └── data-axle-types.ts (new)
├── printing/
│   └── postgrid-client.ts (new)
├── billing/
│   ├── stripe-client.ts (new)
│   └── usage-tracker.ts (new)
└── contexts/
    └── auth-context.tsx (new)

app/
├── auth/
│   ├── login/page.tsx (new)
│   ├── signup/page.tsx (new)
│   └── reset-password/page.tsx (new)
├── dashboard/
│   └── page.tsx (new)
├── onboarding/
│   └── page.tsx (new)
├── campaigns/
│   └── new/
│       └── audience/page.tsx (new)
├── audiences/
│   └── page.tsx (new)
├── fulfillment/
│   └── page.tsx (new)
├── billing/
│   └── page.tsx (new)
└── api/
    ├── contacts/
    │   ├── count/route.ts (new)
    │   └── purchase/route.ts (new)
    ├── audiences/
    │   └── route.ts (new)
    ├── webhooks/
    │   ├── postgrid/route.ts (new)
    │   └── stripe/route.ts (new)
    └── billing/
        └── route.ts (new)

middleware.ts (new)
```

### Files to Deprecate (Hide)

```
app/
├── retail/ (hide from nav)
├── campaigns/
│   ├── matrix/ (hide from nav)
│   └── planning/ (hide from nav)
└── store-groups/ (hide from nav)
```

**Action:** Add feature flag `ENABLE_RETAIL_MODULE=false` and update sidebar to conditionally show these routes.

---

## 🚨 Risk Management

### Critical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data loss during migration** | High | Test migration on copy of database first, keep SQLite backup for 30 days |
| **RLS policy bugs (users see each other's data)** | Critical | Extensive testing with multiple test users, automated tests |
| **API rate limits (Data Axle, PostGrid)** | Medium | Implement rate limiters, queue systems, usage monitoring |
| **Stripe webhook failures** | Medium | Retry logic, manual reconciliation process, monitoring |
| **Breaking changes to existing campaigns** | High | Test all existing features after migration, maintain backward compatibility |

### Rollback Strategy

**If critical bug discovered post-launch:**

1. **Immediate:** Revert Vercel deployment to previous version
2. **Within 1 hour:** Fix bug in development
3. **Within 4 hours:** Deploy fix to production
4. **Within 24 hours:** Post-mortem and preventive measures

**Database Rollback:**
- Keep SQLite backup for 30 days
- Supabase has point-in-time recovery (PITR)
- Can restore to any point in last 7 days

---

## ✅ Progress Tracking

### Overall Progress

- ⬜ **Phase 1:** Database Abstraction (0/5 tasks complete)
- ⬜ **Phase 2:** Supabase Setup (0/5 tasks complete)
- ⬜ **Phase 3:** Authentication (0/5 tasks complete)
- ⬜ **Phase 4:** Data Axle Integration (0/5 tasks complete)
- ⬜ **Phase 5:** PostGrid Fulfillment (0/5 tasks complete)
- ⬜ **Phase 6:** Stripe Billing (0/6 tasks complete)
- ⬜ **Phase 7:** User Experience (0/4 tasks complete)
- ⬜ **Phase 8:** Testing & QA (0/4 tasks complete)
- ⬜ **Phase 9:** Deployment (0/5 tasks complete)
- ⬜ **Phase 10:** Beta Launch (0/4 tasks complete)

**Total:** 0/48 major tasks complete (0%)

### Weekly Goals

**Week 1:**
- [ ] Database abstraction layer complete
- [ ] Supabase project set up
- [ ] Schema migrated and tested

**Week 2:**
- [ ] Authentication working (login/signup)
- [ ] RLS policies tested
- [ ] Data Axle account set up

**Week 3:**
- [ ] Data Axle integration complete
- [ ] Audience targeting UI working
- [ ] PostGrid account set up

**Week 4:**
- [ ] PostGrid integration complete
- [ ] Mail fulfillment working end-to-end
- [ ] Stripe account set up

**Week 5:**
- [ ] Stripe billing complete
- [ ] Dashboard and onboarding complete
- [ ] All UI polish done

**Week 6:**
- [ ] All testing complete
- [ ] Deployed to production
- [ ] First beta users onboarded

---

## 📚 Reference Documents

**Primary References:**
- This document (MASTER PLAN)
- `docs/DATA_AXLE_INTEGRATION_GUIDE.md` - Complete Data Axle API documentation
- `CLAUDE.md` - Development guidelines (updated to reference this plan)

**Keep Updated:**
- Mark tasks complete as you finish them (change ⬜ to ✅)
- Add new tasks/discoveries to relevant phases
- Update risk management section with new risks
- Update progress tracking weekly

---

## 🎯 Success Definition

**DropLab transformation is COMPLETE when:**

✅ Multi-tenant authentication working (users can sign up/login)
✅ Supabase database operational (RLS policies enforced)
✅ Data Axle integration working (real-time counts + contact purchase)
✅ PostGrid integration working (mail can be sent via API)
✅ Stripe billing working (subscriptions + usage metering)
✅ All existing features preserved (copywriting, templates, analytics, etc.)
✅ 10 beta users successfully created and sent campaigns
✅ Zero critical bugs in production for 7 consecutive days

**Post-Launch Definition of Success:**
- 50 paying customers by Month 2
- $5K MRR by Month 3
- <5% monthly churn rate
- 4.5+ star reviews from customers

---

## 📞 Support & Resources

**Technical Support:**
- Supabase: https://supabase.com/docs
- Data Axle: partnerships@data-axle.com
- PostGrid: support@postgrid.com
- Stripe: https://stripe.com/docs

**Community:**
- Supabase Discord
- Next.js GitHub Discussions
- r/SaaS (Reddit)

---

**Last Updated:** October 28, 2025
**Next Review:** Weekly (every Monday)
**Document Owner:** Development Team

---

**Remember:** This is the ONLY planning document. Keep it updated, refer to it daily, and celebrate each completed task! 🚀
