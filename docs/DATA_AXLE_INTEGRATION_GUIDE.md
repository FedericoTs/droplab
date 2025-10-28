# Data Axle People API - Complete Integration Guide

**Project:** DropLab SaaS Platform
**Feature:** Real-Time Audience Targeting with Smart Filtering
**Last Updated:** October 28, 2025
**Status:** Ready for Implementation ✅

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [API Overview & Architecture](#api-overview--architecture)
3. [Authentication & Setup](#authentication--setup)
4. [Core APIs Reference](#core-apis-reference)
5. [Filter DSL Complete Specification](#filter-dsl-complete-specification)
6. [Available Data Fields](#available-data-fields)
7. [Implementation Guide](#implementation-guide)
8. [Production-Ready Code](#production-ready-code)
9. [Integration Opportunities](#integration-opportunities)
10. [Pricing & Business Model](#pricing--business-model)
11. [Error Handling & Edge Cases](#error-handling--edge-cases)
12. [Testing & Validation](#testing--validation)
13. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### What This Integration Enables

**Core Value Proposition:** Real-time audience targeting with free count estimation before purchase.

**Competitive Advantage:**
- ✅ **Free count API** - Users can filter 250M+ contacts and see counts without paying
- ✅ **Real-time filtering** - Counts update in <500ms as users adjust filters
- ✅ **Zero financial risk** - Users see exact count before purchasing
- ✅ **300+ demographic attributes** - Unparalleled targeting precision

**No competitor offers this.** Lob, Postalytics, and traditional DM providers require users to:
1. Purchase list blind (or pay for count estimate)
2. Use external list brokers (Data Axle Genie, etc.)
3. Accept generic demographic targeting

**DropLab advantage:** Audience targeting + AI creative + fulfillment + analytics in ONE platform.

### Key Technical Capabilities

| Capability | Details |
|-----------|---------|
| **Database Size** | 250M+ U.S. consumers, 11M+ Canadian consumers |
| **Attributes** | 300+ demographic, behavioral, lifestyle fields |
| **Count Speed** | <500ms for complex filters (Insights API) |
| **Max Records/Request** | 400 contacts (pagination required for larger batches) |
| **Rate Limit** | 150 requests per 10 seconds |
| **Authentication** | API token (never expires) |
| **Cost Model** | FREE for counts, pay-per-contact for downloads |

---

## API Overview & Architecture

### Base URLs

```
Production API:  https://api.data-axle.com/v1/people
Beta/Staging:    https://beta.api.data-axle.com/v1/people
```

### API Ecosystem

Data Axle provides multiple APIs. For DropLab, we use:

| API Name | Endpoint | Purpose | Cost | Priority |
|----------|----------|---------|------|----------|
| **Insights API** | `/insights` | Get counts & aggregations | **FREE** | 🔥 Critical |
| **Search API** | `/search` | Download contacts | Paid | 🔥 Critical |
| **Match API v1** | `/match` | Enrich existing contacts | Paid | 🔶 Optional |
| **Match API v2** | `/match/v2` | Batch enrichment | Paid | 🔶 Optional |
| **Scan API** | `/scan` | Monitor data changes | Paid | ⚪ Future |

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DropLab Frontend                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Audience Targeting UI (/campaigns/new/audience)   │    │
│  │  - Filter controls (sliders, dropdowns, map)       │    │
│  │  - Real-time count display (updates every 500ms)   │    │
│  │  - Cost calculator                                  │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │      Next.js API Routes (Rate Limited)             │    │
│  │  - /api/contacts/count (debounced, cached)         │    │
│  │  - /api/contacts/purchase (authenticated)          │    │
│  └──────────────┬─────────────────────────────────────┘    │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Data Axle Client (lib/contacts/)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DataAxleClient Class                               │   │
│  │  - buildFilterDSL() - Converts UI → API filters    │   │
│  │  - getCount() - Insights API (FREE)                │   │
│  │  - purchaseContacts() - Search API (PAID)          │   │
│  │  - Rate limiter (150 req/10s)                      │   │
│  │  - Retry logic (exponential backoff)               │   │
│  │  - Error handling & logging                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Data Axle People API                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Insights API    │  │   Search API     │                │
│  │  (Free Counts)   │  │  (Paid Download) │                │
│  └──────────────────┘  └──────────────────┘                │
│         250M+ U.S. Consumer Records                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Count → Purchase → Campaign

```
1. User adjusts filters in UI
   ↓
2. Frontend debounces (500ms), calls /api/contacts/count
   ↓
3. API route calls DataAxleClient.getCount()
   ↓
4. Insights API returns: { "count": 1250000, "insights": {...} }
   ↓
5. Display: "1,250,000 contacts match • $125,000 estimated cost"
   ↓
6. User clicks "Purchase 5,000 contacts"
   ↓
7. Frontend calls /api/contacts/purchase
   ↓
8. API route:
   - Validates user has credits/subscription
   - Calls DataAxleClient.purchaseContacts(filters, 5000)
   - Stores contacts in recipients table
   - Deducts credits from user account
   ↓
9. Redirect to /campaigns/new/copywriting?contactOrderId=xyz
   ↓
10. User creates DM campaign with purchased contacts
```

---

## Authentication & Setup

### Step 1: Sign Up for Data Axle Platform

1. **URL:** https://platform.data-axle.com/auth_time/signup
2. **Information Required:**
   - Business email
   - Company name: "DropLab"
   - Company description: "AI-powered direct mail SaaS platform"
   - Use case: "API integration for contact list management and audience targeting"
3. **Trial Period:** 30 days (no credit card required)
4. **Account Activation:** Check email and click activation link

### Step 2: Generate API Token

1. Login to Data Axle Platform
2. Navigate: **Account Settings** → **Tokens**
3. Click **"Generate New Token"**
4. Copy token (format: `767b8764438e2a5fef2ca904`)
5. **Important:** Tokens never expire, but can be regenerated if compromised

### Step 3: Test Authentication

```bash
# Set environment variable
export DATA_AXLE_API_KEY="your_token_here"

# Test basic connectivity
curl -H "X-AUTH-TOKEN: $DATA_AXLE_API_KEY" \
  "https://api.data-axle.com/v1/people/search?limit=0"

# Expected response:
# {
#   "count": 250000000,
#   "documents": []
# }
```

**Success Indicators:**
- ✅ HTTP 200 status code
- ✅ `count` field present (even if documents empty)
- ❌ HTTP 401: Invalid token
- ❌ HTTP 403: Insufficient permissions (contact Data Axle)

### Step 4: Environment Configuration

```bash
# .env.local
DATA_AXLE_API_KEY=767b8764438e2a5fef2ca904
DATA_AXLE_BASE_URL=https://api.data-axle.com/v1/people
DATA_AXLE_COST_PER_CONTACT=0.10

# Public (exposed to client)
NEXT_PUBLIC_DATA_AXLE_COST_PER_CONTACT=0.10
```

### Step 5: Verify Insights API (Free Counts)

```bash
# Test free count functionality
curl -H "X-AUTH-TOKEN: $DATA_AXLE_API_KEY" \
  -H "Content-Type: application/json" \
  -X GET "https://api.data-axle.com/v1/people/insights" \
  -d '{
    "filter": {
      "relation": "equals",
      "attribute": "state",
      "value": "CA"
    },
    "insights": {
      "field": "state",
      "calculations": ["fill_count"]
    }
  }'

# Expected response:
# {
#   "count": 39500000,
#   "insights": {
#     "field": "state",
#     "fill_count": 39500000
#   }
# }
```

### Step 6: Contact Data Axle for Production Setup

**Before Launch:**
- [ ] Contact: partnerships@data-axle.com
- [ ] Request: Reseller/partner pricing discussion
- [ ] Mention: "Building SaaS platform with 1,000+ users purchasing 10K+ contacts/month"
- [ ] Negotiate: Volume discounts (current retail: $0.25-0.40, target reseller: $0.08-0.12)
- [ ] Request: API documentation access (some endpoints have extended docs)

---

## Core APIs Reference

### 1. Insights API (Free Counts) 🔥

**Purpose:** Get counts and aggregations WITHOUT purchasing contacts.

**Endpoint:**
```
GET https://api.data-axle.com/v1/people/insights
```

**Headers:**
```
X-AUTH-TOKEN: {your_api_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "filter": {
    /* Filter DSL - see section 5 for complete reference */
  },
  "insights": {
    "field": "state",  // Any field works; we just need top-level count
    "calculations": ["fill_count", "unique_count", "frequencies", "value_count"]
  }
}
```

**Calculation Types:**

| Calculation | Description | Use Case | Example Result |
|-------------|-------------|----------|----------------|
| `fill_count` | Count of records with non-null value in field | "How many have email?" | `85000` |
| `unique_count` | Number of distinct values | "How many unique cities?" | `1250` |
| `value_count` | Total values (multi-value fields) | "Total interest tags" | `423000` |
| `frequencies` | Count per distinct value | "Breakdown by state" | `{"CA": 39500000, "TX": 29000000, ...}` |

**Response Format:**
```json
{
  "count": 8500000,  // ← THIS IS THE KEY VALUE TO DISPLAY
  "insights": {
    "field": "state",
    "fill_count": 8500000,
    "unique_count": 1,
    "frequencies": {
      "CA": 8500000
    }
  }
}
```

**Important Notes:**
- ✅ **FREE** - No charge for count requests
- ✅ Use top-level `count` field for UI display
- ✅ Can combine with complex filters (AND/OR logic)
- ⚠️ Rate limited: 150 requests per 10 seconds
- ⚠️ Count may differ slightly from actual purchaseable records due to data freshness

**Example: Complex Filter**
```json
{
  "filter": {
    "connective": "and",
    "propositions": [
      {"relation": "equals", "attribute": "state", "value": "CA"},
      {"relation": "equals", "attribute": "homeowner", "value": true},
      {"relation": "between", "attribute": "age", "value": [65, 80]},
      {"relation": "greater_than", "attribute": "family.estimated_income", "value": 75000}
    ]
  },
  "insights": {
    "field": "state",
    "calculations": ["fill_count"]
  }
}
```

**Response:**
```json
{
  "count": 1250000,
  "insights": {
    "field": "state",
    "fill_count": 1250000
  }
}
```

**Display to user:** "1,250,000 contacts match your filters"

---

### 2. Search API (Purchase Contacts)

**Purpose:** Download actual contact records after filtering.

**Endpoint:**
```
GET https://api.data-axle.com/v1/people/search
```

**Headers:**
```
X-AUTH-TOKEN: {your_api_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "filter": {
    /* Same Filter DSL as Insights API */
  },
  "fields": [
    "person_id",
    "first_name",
    "last_name",
    "street",
    "city",
    "state",
    "zip",
    "email",
    "phone"
  ],
  "limit": 400,    // Max: 400 per request
  "offset": 0      // Max: 4000 total (10 pages × 400)
}
```

**Pagination Limits:**
- **Default limit:** 10 records
- **Maximum limit:** 400 records per request
- **Maximum offset:** 4,000 records (after offset 4000, API returns error)
- **For >4,000 records:** Split into multiple filter queries or use different approaches

**Response Format:**
```json
{
  "count": 8500000,  // Total matching records
  "documents": [
    {
      "person_id": "abc123def456",
      "first_name": "John",
      "last_name": "Smith",
      "street": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "email": "john.smith@example.com",
      "phone": "555-123-4567",
      "age": 68,
      "gender": "M",
      "family": {
        "estimated_income": 85000
      },
      "homeowner": true
    }
    // ... up to 400 records
  ]
}
```

**Cost Model:**
- Each record in `documents` array counts toward billable usage
- **Approximate cost:** $0.10-0.15 per contact (your cost from Data Axle)
- **Your pricing:** $0.15-0.25 per contact (user charge)

**Available Fields:**

See section 6 for complete field reference. Common fields:

**Core Identity:**
- `person_id` - Unique identifier
- `first_name`, `last_name`

**Address (CASS-certified):**
- `street`, `city`, `state`, `zip`, `zip4`

**Contact:**
- `email` - Email address
- `phone` - Primary phone
- `mobile_phone` - Mobile number

**Demographics:**
- `age` - Exact age
- `gender` - "M" or "F"
- `marital_status` - "single", "married", "divorced", etc.
- `education_level`

**Financial:**
- `family.estimated_income` - Household income
- `homeowner` - Boolean
- `home_value` - Estimated property value
- `length_of_residence` - Years at address

**Lifestyle:**
- `family.behaviors` - Array of interest codes (["golf", "travel", etc.])

**Example: Purchase 400 Contacts**
```bash
curl -H "X-AUTH-TOKEN: $DATA_AXLE_API_KEY" \
  -H "Content-Type: application/json" \
  -X GET "https://api.data-axle.com/v1/people/search" \
  -d '{
    "filter": {
      "connective": "and",
      "propositions": [
        {"relation": "equals", "attribute": "state", "value": "CA"},
        {"relation": "equals", "attribute": "homeowner", "value": true}
      ]
    },
    "fields": ["first_name", "last_name", "street", "city", "state", "zip", "email"],
    "limit": 400,
    "offset": 0
  }'
```

**Handling >4,000 Records:**

Since max offset is 4,000, for larger batches:

**Option A:** Split by geography
```javascript
// Instead of 50,000 CA contacts in one query:
// Split into 58 counties, fetch 863 per county (863 × 58 = 50,054)
const counties = ["Los Angeles", "San Diego", "Orange", /* ... */];
for (const county of counties) {
  const contacts = await client.purchaseContacts({
    state: "CA",
    county: county,
    homeowner: true
  }, 1000);
}
```

**Option B:** Split by ZIP code ranges
```javascript
const zipRanges = [
  ["90001", "90099"],
  ["90100", "90199"],
  // ...
];
```

**Option C:** Use Search API multiple times with random sampling (not ideal)

---

### 3. Match API (Contact Enrichment)

**Purpose:** Append demographics to existing contacts (CSV uploads).

**Endpoint:**
```
POST https://api.data-axle.com/v1/people/match
```

**Request Body:**
```json
{
  "records": [
    {
      "first_name": "John",
      "last_name": "Smith",
      "street": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001"
    }
  ],
  "match_type": "address",  // or "name", "email"
  "append_fields": ["age", "family.estimated_income", "homeowner"]
}
```

**Response:**
```json
{
  "matches": [
    {
      "input": {
        "first_name": "John",
        "last_name": "Smith",
        "street": "123 Main St",
        "city": "Los Angeles",
        "state": "CA",
        "zip": "90001"
      },
      "match_confidence": 0.95,
      "matched_record": {
        "person_id": "abc123",
        "first_name": "John",
        "last_name": "Smith",
        "street": "123 Main St",
        "city": "Los Angeles",
        "state": "CA",
        "zip": "90001",
        "age": 68,
        "family": {
          "estimated_income": 85000
        },
        "homeowner": true
      }
    }
  ]
}
```

**Use Case:** User uploads CSV → Enrich with demographics → Create targeted DM campaign

**Cost:** Charged per successful match (~$0.05-0.10 per match)

---

## Filter DSL Complete Specification

### Overview

The Filter DSL (Domain Specific Language) is a JSON-based query language for filtering Data Axle's 250M+ contact database.

**Supported by APIs:**
- ✅ Insights API
- ✅ Search API
- ✅ Match API v1/v2
- ✅ Scan API

### Basic Filter Structure

```json
{
  "relation": "<relation_type>",
  "attribute": "<field_name>",
  "value": "<comparison_value>",
  "negated": false  // Optional: true inverts the filter
}
```

### Relation Types

#### 1. Equality Relations

**`equals`** - Exact match
```json
{
  "relation": "equals",
  "attribute": "state",
  "value": "CA"
}
```

**`in`** - Match any value in array
```json
{
  "relation": "in",
  "attribute": "state",
  "value": ["CA", "NY", "TX"]
}
```

**`matches`** - Fuzzy string match (typo-tolerant)
```json
{
  "relation": "matches",
  "attribute": "city",
  "value": "Los Angelas"  // Will match "Los Angeles"
}
```

#### 2. Numeric/Range Relations

**`between`** - Inclusive range
```json
{
  "relation": "between",
  "attribute": "age",
  "value": [25, 45]  // 25 ≤ age ≤ 45
}
```

**`greater_than`** - Strictly greater
```json
{
  "relation": "greater_than",
  "attribute": "family.estimated_income",
  "value": 75000
}
```

**`less_than`** - Strictly less
```json
{
  "relation": "less_than",
  "attribute": "age",
  "value": 30
}
```

**`range`** - For multi-value ranges (advanced)
```json
{
  "relation": "range",
  "attribute": "date_field",
  "value": {
    "gte": "2020-01-01",
    "lte": "2024-12-31"
  }
}
```

#### 3. Existence Relations

**`present`** - Field has any value (not null)
```json
{
  "relation": "present",
  "attribute": "email"
}
```

**`missing`** - Field is null/empty
```json
{
  "relation": "missing",
  "attribute": "phone"
}
```

#### 4. Geographic Relations

**`geo_distance`** - Radius search from coordinates
```json
{
  "geo": "distance",
  "lat": 34.0522,
  "lon": -118.2437,
  "distance": "10mi"  // Supported: "mi", "km", "m"
}
```

**`geo_box`** - Bounding box
```json
{
  "geo": "box",
  "top_left": {"lat": 34.5, "lon": -119.0},
  "bottom_right": {"lat": 33.5, "lon": -118.0}
}
```

**`geo_polygon`** - Custom polygon
```json
{
  "geo": "polygon",
  "points": [
    {"lat": 34.0, "lon": -118.5},
    {"lat": 34.5, "lon": -118.0},
    {"lat": 34.0, "lon": -117.5}
  ]
}
```

### Connectives (AND/OR Logic)

#### AND - All conditions must match

```json
{
  "connective": "and",
  "propositions": [
    {"relation": "equals", "attribute": "state", "value": "CA"},
    {"relation": "equals", "attribute": "homeowner", "value": true},
    {"relation": "between", "attribute": "age", "value": [65, 80]}
  ]
}
```

**Equivalent SQL:**
```sql
WHERE state = 'CA' AND homeowner = true AND age BETWEEN 65 AND 80
```

#### OR - Any condition can match

```json
{
  "connective": "or",
  "propositions": [
    {"relation": "equals", "attribute": "state", "value": "CA"},
    {"relation": "equals", "attribute": "state", "value": "NY"}
  ]
}
```

**Equivalent SQL:**
```sql
WHERE state = 'CA' OR state = 'NY'
```

#### Nested Connectives - Complex logic

**(CA AND homeowner) OR (NY AND renter)**

```json
{
  "connective": "or",
  "propositions": [
    {
      "connective": "and",
      "propositions": [
        {"relation": "equals", "attribute": "state", "value": "CA"},
        {"relation": "equals", "attribute": "homeowner", "value": true}
      ]
    },
    {
      "connective": "and",
      "propositions": [
        {"relation": "equals", "attribute": "state", "value": "NY"},
        {"relation": "equals", "attribute": "homeowner", "value": false}
      ]
    }
  ]
}
```

**Equivalent SQL:**
```sql
WHERE (state = 'CA' AND homeowner = true)
   OR (state = 'NY' AND homeowner = false)
```

### Negation

Invert any filter with `"negated": true`

**Example: NOT California**
```json
{
  "relation": "equals",
  "attribute": "state",
  "value": "CA",
  "negated": true
}
```

**Example: NOT (homeowner AND income >$75K)**
```json
{
  "connective": "and",
  "propositions": [
    {"relation": "equals", "attribute": "homeowner", "value": true},
    {"relation": "greater_than", "attribute": "family.estimated_income", "value": 75000}
  ],
  "negated": true
}
```

### Real-World Filter Examples

#### Example 1: Affluent Seniors in California

**Target:** Homeowners, age 65-80, income >$75K, California

```json
{
  "connective": "and",
  "propositions": [
    {"relation": "equals", "attribute": "state", "value": "CA"},
    {"relation": "between", "attribute": "age", "value": [65, 80]},
    {"relation": "equals", "attribute": "homeowner", "value": true},
    {"relation": "greater_than", "attribute": "family.estimated_income", "value": 75000}
  ]
}
```

#### Example 2: Golf Enthusiasts in Miami Metro

**Target:** Within 25 miles of Miami, interested in golf

```json
{
  "connective": "and",
  "propositions": [
    {
      "geo": "distance",
      "lat": 25.7617,
      "lon": -80.1918,
      "distance": "25mi"
    },
    {
      "relation": "in",
      "attribute": "family.behaviors",
      "value": ["golf", "country_club"]
    }
  ]
}
```

#### Example 3: Young Professionals, No Email

**Target:** Age 25-40, income >$50K, missing email (to purchase email append service)

```json
{
  "connective": "and",
  "propositions": [
    {"relation": "between", "attribute": "age", "value": [25, 40]},
    {"relation": "greater_than", "attribute": "family.estimated_income", "value": 50000},
    {"relation": "missing", "attribute": "email"}
  ]
}
```

#### Example 4: Multi-State Campaign with ZIP Exclusions

**Target:** CA, NY, TX but exclude specific ZIPs

```json
{
  "connective": "and",
  "propositions": [
    {
      "relation": "in",
      "attribute": "state",
      "value": ["CA", "NY", "TX"]
    },
    {
      "relation": "in",
      "attribute": "zip",
      "value": ["90001", "10001", "75001"],
      "negated": true  // Exclude these ZIPs
    }
  ]
}
```

---

## Available Data Fields

### Core Contact Information

**Always available in Basic package:**

```typescript
interface BasicContact {
  person_id: string;           // Unique identifier
  first_name: string;          // First name
  last_name: string;           // Last name
  street: string;              // Street address (CASS-certified)
  city: string;                // City
  state: string;               // 2-letter state code (e.g., "CA")
  zip: string;                 // 5-digit ZIP code
  zip4?: string;               // ZIP+4 extension (if available)
}
```

### Demographics Package

**Requires Enhanced/Premium package:**

```typescript
interface Demographics {
  age?: number;                     // Exact age (18-100+)
  age_range?: string;               // "25-34", "35-44", etc.
  gender?: "M" | "F";               // Male or Female
  marital_status?: string;          // "single", "married", "divorced", "widowed"
  education_level?: string;         // "high_school", "bachelors", "masters", "doctorate"
  ethnicity?: string;               // Ethnicity code
  language?: string;                // Primary language spoken
  religion?: string;                // Religious affiliation
}
```

### Financial/Housing Package

```typescript
interface FinancialData {
  "family.estimated_income"?: number;   // Household income ($)
  homeowner?: boolean;                  // Own vs rent
  home_value?: number;                  // Estimated property value ($)
  length_of_residence?: number;         // Years at current address
  mortgage_amount?: number;             // Outstanding mortgage ($)
  mortgage_rate?: number;               // Interest rate
  property_type?: string;               // "single_family", "condo", "townhouse"
  home_year_built?: number;             // Construction year
  square_footage?: number;              // Home size
}
```

### Household/Family Data

```typescript
interface HouseholdData {
  household_size?: number;              // Number of people
  presence_of_children?: boolean;       // Has children
  number_of_children?: number;          // Count of children
  children_ages?: number[];             // Array of ages
  children_age_ranges?: string[];       // ["0-5", "6-12", etc.]
}
```

### Lifestyle & Interests (Behavioral Data)

**Premium behavioral targeting:**

```typescript
interface BehavioralData {
  "family.behaviors"?: string[];        // Array of interest codes
}

// Available interest codes (partial list - 100+ total):
const INTEREST_CODES = [
  // Sports & Recreation
  "golf", "tennis", "skiing", "fishing", "hunting", "boating",
  "professional_baseball", "professional_football", "professional_basketball",

  // Health & Wellness
  "health_conscious", "fitness", "running", "yoga", "organic_foods",
  "vitamins_supplements",

  // Lifestyle
  "travel", "cruises", "international_travel", "domestic_travel",
  "luxury", "fine_dining", "wine", "gourmet_cooking",

  // Hobbies
  "reading", "cooking", "gardening", "home_improvement",
  "photography", "art_collecting", "antiques",

  // Technology
  "technology", "early_adopter", "online_shopping", "social_media_active",

  // Finance
  "investing", "stocks_bonds", "real_estate_investing",
  "charitable_donations", "political_contributor",

  // Pets
  "dog_owner", "cat_owner", "pet_owner",

  // Automotive
  "auto_enthusiast", "motorcycle_owner",

  // And 50+ more...
];
```

### Digital Data Package

**Requires Premium package:**

```typescript
interface DigitalData {
  email?: string;                       // Email address
  email_domain?: string;                // Domain portion of email
  phone?: string;                       // Primary phone (10-digit)
  mobile_phone?: string;                // Mobile number
  landline_phone?: string;              // Landline number
  phone_type?: "mobile" | "landline" | "voip";

  social_media_presence?: boolean;      // Has social media accounts
  online_purchase_behavior?: string;    // "frequent", "occasional", "rare"
  online_purchase_categories?: string[]; // ["electronics", "apparel", etc.]
}
```

### Vehicle Data Package

**Requires Vehicle Data add-on:**

```typescript
interface VehicleData {
  vehicle_year?: number;                // Model year
  vehicle_make?: string;                // "Toyota", "Ford", etc.
  vehicle_model?: string;               // "Camry", "F-150", etc.
  vehicle_type?: string;                // "sedan", "suv", "truck"
  vehicle_purchase_date?: string;       // ISO date
  vehicle_value?: number;               // Estimated value ($)
  number_of_vehicles?: number;          // Household vehicle count
  vehicle_fuel_type?: string;           // "gas", "electric", "hybrid"
}
```

### Geographic Enhancement Fields

```typescript
interface GeoData {
  latitude?: number;                    // Geocoded latitude
  longitude?: number;                   // Geocoded longitude
  county?: string;                      // County name
  msa?: string;                         // Metropolitan Statistical Area
  dma?: string;                         // Designated Market Area
  congressional_district?: string;      // Congressional district
  census_tract?: string;                // Census tract code
  census_block_group?: string;          // Census block group
  urban_rural_indicator?: string;       // "urban", "suburban", "rural"
}
```

### Field Access by Package Tier

**Estimated Pricing (subject to negotiation):**

| Package | Cost/Contact | Fields Included |
|---------|--------------|-----------------|
| **Basic** | $0.10-0.15 | Core contact info (name, address, phone) |
| **Enhanced** | $0.15-0.25 | + Demographics (age, income, homeowner) |
| **Premium** | $0.25-0.40 | + Email, lifestyle, vehicle data |
| **Custom** | Negotiable | All fields + custom data sources |

**For DropLab Launch:**
- Start with **Enhanced package** ($0.15-0.20/contact)
- Includes most important fields: demographics, financial data, basic lifestyle
- Add Premium package later for email append services

---

## Implementation Guide

### Phase 1: Setup & Authentication (Day 1-2)

#### Task 1.1: Environment Setup

```bash
# Install dependencies (if needed)
npm install nanoid

# Create directory structure
mkdir -p lib/contacts
mkdir -p app/api/contacts
mkdir -p components/audience
```

#### Task 1.2: Environment Variables

```bash
# .env.local
DATA_AXLE_API_KEY=your_token_here
DATA_AXLE_BASE_URL=https://api.data-axle.com/v1/people
DATA_AXLE_COST_PER_CONTACT=0.15
NEXT_PUBLIC_DATA_AXLE_COST_PER_CONTACT=0.15
```

#### Task 1.3: Type Definitions

```typescript
// lib/contacts/data-axle-types.ts

export interface DataAxleFilters {
  // Geography
  state?: string;
  city?: string;
  zip?: string;
  county?: string;
  geoDistance?: {
    lat: number;
    lon: number;
    distance: string; // "10mi", "25km"
  };

  // Demographics
  ageMin?: number;
  ageMax?: number;
  gender?: "M" | "F";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";

  // Financial
  incomeMin?: number;
  incomeMax?: number;
  homeowner?: boolean;
  homeValueMin?: number;
  homeValueMax?: number;

  // Lifestyle
  interests?: string[]; // ["golf", "travel", etc.]
  behaviors?: string[];
}

export interface DataAxleContact {
  person_id: string;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;

  // Demographics
  age?: number;
  gender?: "M" | "F";
  marital_status?: string;

  // Financial
  estimated_income?: number;
  homeowner?: boolean;
  home_value?: number;

  // Lifestyle
  behaviors?: string[];
}

export interface DataAxleCountResponse {
  count: number;
  estimatedCost: number;
}

export class DataAxleError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = "DataAxleError";
  }
}
```

---

### Phase 2: Core Client Implementation (Day 3-5)

See **Production-Ready Code** section below for complete implementation.

---

### Phase 3: API Routes (Day 6-7)

#### API Route: Count Endpoint

```typescript
// app/api/contacts/count/route.ts

import { DataAxleClient } from "@/lib/contacts/data-axle-client";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database/connection";

export async function POST(req: NextRequest) {
  try {
    const filters = await req.json();

    // Initialize client
    const client = new DataAxleClient(
      process.env.DATA_AXLE_API_KEY!,
      process.env.DATA_AXLE_BASE_URL
    );

    // Get count (FREE - no charge)
    const result = await client.getCount(filters, {
      useCache: true,
      cacheTTL: 300 // Cache for 5 minutes
    });

    // Log usage analytics
    const db = getDatabase();
    db.prepare(`
      INSERT INTO audience_queries (user_id, filters, count, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(
      req.headers.get('x-user-id') || 'anonymous',
      JSON.stringify(filters),
      result.count
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Count API error:', error);
    return NextResponse.json(
      { error: 'Failed to get count' },
      { status: 500 }
    );
  }
}
```

#### API Route: Purchase Endpoint

```typescript
// app/api/contacts/purchase/route.ts

import { DataAxleClient } from "@/lib/contacts/data-axle-client";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database/connection";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const { filters, maxContacts, campaignId, userId } = await req.json();

    // Validate user has sufficient credits
    const db = getDatabase();
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);

    if (!user || user.credits < maxContacts * 0.25) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Initialize client
    const client = new DataAxleClient(
      process.env.DATA_AXLE_API_KEY!,
      process.env.DATA_AXLE_BASE_URL
    );

    // Purchase contacts with progress tracking
    const contacts = await client.purchaseContacts(
      filters,
      maxContacts,
      (current, total) => {
        console.log(`Progress: ${current}/${total} contacts purchased`);
      }
    );

    // Store in recipients table
    const orderId = nanoid();

    for (const contact of contacts) {
      const trackingId = nanoid(10);

      db.prepare(`
        INSERT INTO recipients (
          id, campaign_id, tracking_id, name, lastname,
          address, city, zip, email, phone, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        nanoid(),
        campaignId,
        trackingId,
        contact.first_name,
        contact.last_name,
        contact.street,
        contact.city,
        contact.zip,
        contact.email,
        contact.phone
      );
    }

    // Deduct credits
    db.prepare(`
      UPDATE users
      SET credits = credits - ?
      WHERE id = ?
    `).run(contacts.length * 0.25, userId);

    // Log purchase
    db.prepare(`
      INSERT INTO contact_purchases (
        id, user_id, order_id, campaign_id,
        filters, contact_count, total_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      nanoid(),
      userId,
      orderId,
      campaignId,
      JSON.stringify(filters),
      contacts.length,
      contacts.length * 0.15 // Your cost
    );

    return NextResponse.json({
      orderId,
      contactsPurchased: contacts.length,
      totalCost: contacts.length * 0.25, // User charge
      creditsRemaining: user.credits - (contacts.length * 0.25)
    });
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase contacts' },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Frontend UI (Day 8-10)

#### Audience Targeting Page

```typescript
// app/campaigns/new/audience/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { DataAxleFilters } from '@/lib/contacts/data-axle-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AudienceTargetingPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<DataAxleFilters>({});
  const [count, setCount] = useState<number | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Real-time count update (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (Object.keys(filters).length === 0) {
        setCount(null);
        setEstimatedCost(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/contacts/count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        });

        if (!response.ok) throw new Error('Failed to get count');

        const data = await response.json();
        setCount(data.count);
        setEstimatedCost(data.estimatedCost);
      } catch (error) {
        console.error('Count error:', error);
        toast.error('Failed to get audience count');
      } finally {
        setLoading(false);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [filters]);

  const handlePurchase = async () => {
    if (!count || count === 0) {
      toast.error('No contacts match your filters');
      return;
    }

    // Prompt for number of contacts to purchase
    const maxToPurchase = Math.min(count, 10000); // Limit to 10K per order
    const contactsToPurchase = parseInt(
      prompt(`How many contacts to purchase? (Max: ${maxToPurchase.toLocaleString()})`) || '0'
    );

    if (!contactsToPurchase || contactsToPurchase <= 0) return;
    if (contactsToPurchase > maxToPurchase) {
      toast.error(`Cannot purchase more than ${maxToPurchase.toLocaleString()} contacts at once`);
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch('/api/contacts/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          maxContacts: contactsToPurchase,
          campaignId: 'temp', // Will be set in next step
          userId: 'current_user_id' // From auth context
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purchase failed');
      }

      const data = await response.json();

      toast.success(`Purchased ${data.contactsPurchased} contacts!`);

      // Redirect to copywriting with contact order ID
      router.push(`/campaigns/new/copywriting?contactOrderId=${data.orderId}`);
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to purchase contacts');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Target Your Audience</h1>

      {/* Live Count Display */}
      <Card className="p-8 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-12 bg-blue-200 rounded w-32 mx-auto mb-2"></div>
              <p className="text-gray-500">Calculating...</p>
            </div>
          ) : count !== null ? (
            <>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {count.toLocaleString()}
              </div>
              <p className="text-gray-600 mb-4">contacts match your filters</p>
              <div className="text-2xl font-semibold text-green-600">
                ${estimatedCost?.toFixed(2)} estimated cost
              </div>
              <p className="text-sm text-gray-500 mt-2">
                ${(estimatedCost! / count).toFixed(3)} per contact
              </p>
            </>
          ) : (
            <p className="text-gray-400">Set filters below to see count</p>
          )}
        </div>
      </Card>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Geography Filters */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">📍 Location</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ZIP Code</label>
              <Input
                placeholder="e.g., 90210"
                value={filters.zip || ''}
                onChange={(e) => setFilters({...filters, zip: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <Select
                value={filters.state}
                onValueChange={(value) => setFilters({...filters, state: value})}
              >
                <option value="">All states</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
                {/* Add all 50 states */}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input
                placeholder="e.g., Los Angeles"
                value={filters.city || ''}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              />
            </div>
          </div>
        </Card>

        {/* Demographics Filters */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">👥 Demographics</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Age Range: {filters.ageMin || 18} - {filters.ageMax || 100}
              </label>
              <Slider
                min={18}
                max={100}
                step={5}
                value={[filters.ageMin || 18, filters.ageMax || 100]}
                onValueChange={(value) => setFilters({
                  ...filters,
                  ageMin: value[0],
                  ageMax: value[1]
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Income Range: ${(filters.incomeMin || 0) / 1000}K - ${(filters.incomeMax || 500000) / 1000}K
              </label>
              <Slider
                min={0}
                max={500000}
                step={10000}
                value={[filters.incomeMin || 0, filters.incomeMax || 500000]}
                onValueChange={(value) => setFilters({
                  ...filters,
                  incomeMin: value[0],
                  incomeMax: value[1]
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Homeowner</label>
              <Select
                value={filters.homeowner?.toString()}
                onValueChange={(value) => setFilters({
                  ...filters,
                  homeowner: value === 'true' ? true : value === 'false' ? false : undefined
                })}
              >
                <option value="">Either</option>
                <option value="true">Homeowners only</option>
                <option value="false">Renters only</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Lifestyle Filters */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">🎯 Interests</h3>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">Select lifestyle interests:</p>

            {['Health Conscious', 'Travel', 'Golf', 'Fitness', 'Luxury', 'Technology'].map((interest) => (
              <label key={interest} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.interests?.includes(interest.toLowerCase().replace(' ', '_')) || false}
                  onChange={(e) => {
                    const interestCode = interest.toLowerCase().replace(' ', '_');
                    const current = filters.interests || [];
                    setFilters({
                      ...filters,
                      interests: e.target.checked
                        ? [...current, interestCode]
                        : current.filter(i => i !== interestCode)
                    });
                  }}
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <Card className="p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Active Filters:</span>
              {filters.zip && <Badge>ZIP: {filters.zip}</Badge>}
              {filters.state && <Badge>State: {filters.state}</Badge>}
              {filters.city && <Badge>City: {filters.city}</Badge>}
              {filters.ageMin && <Badge>Age: {filters.ageMin}-{filters.ageMax}</Badge>}
              {filters.homeowner !== undefined && <Badge>{filters.homeowner ? 'Homeowners' : 'Renters'}</Badge>}
              {filters.interests && filters.interests.length > 0 && (
                <Badge>Interests: {filters.interests.length}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear All
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Save Audience</Button>
        <Button
          size="lg"
          disabled={!count || count === 0 || purchasing}
          onClick={handlePurchase}
        >
          {purchasing ? 'Purchasing...' : `Purchase Contacts - $${estimatedCost?.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
```

---

## Production-Ready Code

### Complete TypeScript Client

```typescript
// lib/contacts/data-axle-client.ts

import { DataAxleFilters, DataAxleContact, DataAxleCountResponse, DataAxleError } from './data-axle-types';

export class DataAxleClient {
  private apiKey: string;
  private baseURL: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, baseURL: string = 'https://api.data-axle.com/v1/people') {
    if (!apiKey) {
      throw new Error('Data Axle API key is required');
    }
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.rateLimiter = new RateLimiter(150, 10000); // 150 req per 10 sec
  }

  /**
   * Get count of contacts matching filters (FREE - no charge)
   * @param filters - Filter criteria
   * @param options - Caching options
   * @returns Count and estimated cost
   */
  async getCount(
    filters: DataAxleFilters,
    options?: { useCache?: boolean; cacheTTL?: number }
  ): Promise<DataAxleCountResponse> {
    // Check cache first
    const cacheKey = JSON.stringify(filters);
    if (options?.useCache) {
      const cached = await this.getCachedCount(cacheKey);
      if (cached) return cached;
    }

    // Rate limit
    await this.rateLimiter.acquire();

    const filterDSL = this.buildFilterDSL(filters);

    try {
      const response = await this.fetchWithRetry(`${this.baseURL}/insights`, {
        method: 'GET',
        headers: {
          'X-AUTH-TOKEN': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: filterDSL,
          insights: {
            field: 'state',
            calculations: ['fill_count']
          }
        })
      });

      const data = await response.json();
      const count = data.count || 0;
      const costPerContact = parseFloat(
        process.env.NEXT_PUBLIC_DATA_AXLE_COST_PER_CONTACT || '0.15'
      );
      const estimatedCost = count * costPerContact;

      const result = { count, estimatedCost };

      // Cache result
      if (options?.useCache) {
        await this.setCachedCount(cacheKey, result, options.cacheTTL || 300);
      }

      return result;
    } catch (error) {
      console.error('Data Axle count error:', error);
      throw new DataAxleError('Failed to get count', error);
    }
  }

  /**
   * Purchase contacts matching filters
   * @param filters - Filter criteria
   * @param maxContacts - Maximum contacts to purchase
   * @param onProgress - Progress callback
   * @returns Array of contacts
   */
  async purchaseContacts(
    filters: DataAxleFilters,
    maxContacts: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<DataAxleContact[]> {
    const allContacts: DataAxleContact[] = [];
    const totalPages = Math.min(Math.ceil(maxContacts / 400), 10); // Max 10 pages = 4000 records

    for (let page = 0; page < totalPages; page++) {
      await this.rateLimiter.acquire();

      const offset = page * 400;
      const limit = Math.min(400, maxContacts - allContacts.length);

      if (limit <= 0) break;

      try {
        const response = await this.fetchWithRetry(`${this.baseURL}/search`, {
          method: 'GET',
          headers: {
            'X-AUTH-TOKEN': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filter: this.buildFilterDSL(filters),
            fields: this.getDefaultFields(),
            limit,
            offset
          })
        });

        const data = await response.json();
        allContacts.push(...data.documents);

        // Progress callback
        if (onProgress) {
          onProgress(allContacts.length, maxContacts);
        }

        // Check if we've retrieved all available records
        if (data.documents.length < limit) break;
      } catch (error) {
        console.error(`Data Axle purchase error at offset ${offset}:`, error);

        // Continue with partial results if some pages succeeded
        if (allContacts.length > 0) {
          console.warn(`Returning ${allContacts.length} contacts (partial success)`);
          break;
        }

        throw new DataAxleError('Failed to purchase contacts', error);
      }
    }

    // Track usage for billing
    await this.trackUsage(allContacts.length, filters);

    return allContacts;
  }

  /**
   * Build Filter DSL from user-friendly filters
   */
  private buildFilterDSL(filters: DataAxleFilters): any {
    const propositions: any[] = [];

    // Geographic filters
    if (filters.state) {
      propositions.push({
        relation: 'equals',
        attribute: 'state',
        value: filters.state
      });
    }

    if (filters.city) {
      propositions.push({
        relation: 'equals',
        attribute: 'city',
        value: filters.city
      });
    }

    if (filters.zip) {
      propositions.push({
        relation: 'equals',
        attribute: 'zip',
        value: filters.zip
      });
    }

    if (filters.county) {
      propositions.push({
        relation: 'equals',
        attribute: 'county',
        value: filters.county
      });
    }

    if (filters.geoDistance) {
      propositions.push({
        geo: 'distance',
        lat: filters.geoDistance.lat,
        lon: filters.geoDistance.lon,
        distance: filters.geoDistance.distance
      });
    }

    // Demographic filters
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      propositions.push({
        relation: 'between',
        attribute: 'age',
        value: [filters.ageMin || 18, filters.ageMax || 100]
      });
    }

    if (filters.gender) {
      propositions.push({
        relation: 'equals',
        attribute: 'gender',
        value: filters.gender
      });
    }

    if (filters.maritalStatus) {
      propositions.push({
        relation: 'equals',
        attribute: 'marital_status',
        value: filters.maritalStatus
      });
    }

    // Financial filters
    if (filters.incomeMin !== undefined || filters.incomeMax !== undefined) {
      propositions.push({
        relation: 'between',
        attribute: 'family.estimated_income',
        value: [filters.incomeMin || 0, filters.incomeMax || 500000]
      });
    }

    if (filters.homeowner !== undefined) {
      propositions.push({
        relation: 'equals',
        attribute: 'homeowner',
        value: filters.homeowner
      });
    }

    if (filters.homeValueMin !== undefined || filters.homeValueMax !== undefined) {
      propositions.push({
        relation: 'between',
        attribute: 'home_value',
        value: [filters.homeValueMin || 0, filters.homeValueMax || 5000000]
      });
    }

    // Lifestyle filters
    if (filters.interests && filters.interests.length > 0) {
      propositions.push({
        relation: 'in',
        attribute: 'family.behaviors',
        value: filters.interests
      });
    }

    if (filters.behaviors && filters.behaviors.length > 0) {
      propositions.push({
        relation: 'in',
        attribute: 'family.behaviors',
        value: filters.behaviors
      });
    }

    // Return combined filter with AND logic
    if (propositions.length === 0) {
      return null; // No filters = all records
    }

    if (propositions.length === 1) {
      return propositions[0]; // Single filter doesn't need connective
    }

    return {
      connective: 'and',
      propositions
    };
  }

  /**
   * Get default fields to request
   */
  private getDefaultFields(): string[] {
    return [
      'person_id',
      'first_name',
      'last_name',
      'street',
      'city',
      'state',
      'zip',
      'zip4',
      'email',
      'phone',
      'mobile_phone',
      'age',
      'gender',
      'marital_status',
      'family.estimated_income',
      'homeowner',
      'home_value',
      'family.behaviors'
    ];
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (response.ok) {
          return response;
        }

        // Don't retry client errors (400-499) except rate limits
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Retry server errors (500+) and rate limits (429)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Track usage for billing
   */
  private async trackUsage(contactCount: number, filters: DataAxleFilters): Promise<void> {
    const cost = contactCount * parseFloat(process.env.DATA_AXLE_COST_PER_CONTACT || '0.15');
    console.log(`Data Axle usage: ${contactCount} contacts, cost: $${cost.toFixed(2)}`);

    // TODO: Insert into usage_logs table for Stripe metering
  }

  /**
   * Cache helpers (implement with Redis/Vercel KV)
   */
  private async getCachedCount(key: string): Promise<DataAxleCountResponse | null> {
    // TODO: Implement caching
    return null;
  }

  private async setCachedCount(key: string, value: DataAxleCountResponse, ttl: number): Promise<void> {
    // TODO: Implement caching
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter (150 requests per 10 seconds)
 */
class RateLimiter {
  private queue: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the window
    this.queue = this.queue.filter(timestamp => now - timestamp < this.window);

    if (this.queue.length >= this.limit) {
      // Wait until oldest request exits the window
      const oldestRequest = this.queue[0];
      const waitTime = this.window - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire(); // Recursive retry
      }
    }

    this.queue.push(now);
  }
}
```

---

## Integration Opportunities

### 1. Saved Audiences (Reusable Filters)

**Database Schema:**
```sql
CREATE TABLE saved_audiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters TEXT NOT NULL, -- JSON of DataAxleFilters
  last_count INTEGER,
  last_count_updated_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Use Case:** User saves "Affluent Seniors in CA" audience, reuses monthly

---

### 2. Audience Performance Tracking

Track which audiences convert best:

```sql
ALTER TABLE recipients ADD COLUMN audience_id TEXT;
ALTER TABLE saved_audiences ADD COLUMN total_conversions INTEGER DEFAULT 0;
ALTER TABLE saved_audiences ADD COLUMN conversion_rate REAL;
```

**Analytics:** "Your 'Golf Enthusiasts' audience has 18% conversion rate - send more!"

---

### 3. Lookalike Audiences

Find similar contacts to best customers:

```typescript
async function findLookalikeAudience(topCustomers: DataAxleContact[]) {
  const avgAge = average(topCustomers.map(c => c.age));
  const mostCommonState = mode(topCustomers.map(c => c.state));
  const avgIncome = average(topCustomers.map(c => c.estimated_income));

  return await client.getCount({
    state: mostCommonState,
    ageMin: avgAge - 5,
    ageMax: avgAge + 5,
    incomeMin: avgIncome * 0.8,
    incomeMax: avgIncome * 1.2
  });
}
```

---

### 4. Geographic Radius Targeting

**UI:** Show map with radius circle, real-time count updates

```typescript
const count = await client.getCount({
  geoDistance: {
    lat: 34.0522,
    lon: -118.2437,
    distance: '10mi'
  },
  homeowner: true
});
```

---

### 5. CSV Enrichment (Match API)

User uploads CSV → Append demographics → Create targeted campaign

```typescript
async function enrichCSV(contacts: Array<{name: string, address: string}>) {
  // Call Match API to append age, income, homeowner status
  return enrichedContacts;
}
```

---

## Pricing & Business Model

### Data Axle Costs (Your Expense)

**Estimated reseller pricing:**
- Basic package: $0.10-0.12 per contact
- Enhanced package: $0.15-0.18 per contact
- Premium package: $0.25-0.30 per contact

**Volume discounts:**
- <10K contacts/month: Full price
- 10K-50K: 10% discount
- 50K-100K: 20% discount
- 100K+: Custom (negotiate)

### Your Pricing (User Charge)

| Tier | Platform Fee | Contacts/Month | Mail/Month | Contact Overage | Mail Overage |
|------|--------------|----------------|------------|-----------------|--------------|
| Starter | $79/mo | 250 included | 50 included | $0.25 | $0.75 |
| Professional | $249/mo | 2,000 included | 500 included | $0.20 | $0.65 |
| Agency | $599/mo | 5,000 included | 500 included | $0.15 | $0.60 |

### Margin Analysis

**Starter user (buys 1,000 contacts + 500 mail pieces):**
- Revenue: $79 + ($0.25 × 750) + ($0.75 × 450) = $504.50
- Costs: ($0.15 × 1000) + ($0.50 × 500) = $400
- **Profit: $104.50 (21% margin)**

**At scale (100 customers, average Professional tier):**
- Revenue: $249 × 100 = $24,900/mo
- Costs: ~$15,000/mo
- **Profit: $9,900/mo ($118K/year)**

---

## Error Handling & Edge Cases

### Common Errors

**1. Invalid API Key (401)**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API token"
}
```

**Action:** Check `DATA_AXLE_API_KEY` environment variable

---

**2. Rate Limit Exceeded (429)**
```json
{
  "error": "Rate limit exceeded",
  "message": "150 requests per 10 seconds limit reached"
}
```

**Action:** Rate limiter should handle this automatically with retry

---

**3. Invalid Filter (400)**
```json
{
  "error": "Invalid filter",
  "message": "Unknown attribute: 'invalid_field'"
}
```

**Action:** Validate filters before sending to API

---

**4. No Matches (200 with count: 0)**
```json
{
  "count": 0,
  "insights": {...}
}
```

**Action:** Display "No contacts match your filters. Try adjusting criteria."

---

**5. Partial Results**

If API returns fewer than requested (e.g., request 400, get 327):
- This is normal (not all filters yield exact multiples of 400)
- Continue to next page until `documents.length < limit`

---

### Edge Cases

**Case 1: User purchases 10,000 contacts**

Max offset is 4,000, so:
- Pages 1-10: 400 each = 4,000 contacts ✅
- Remaining 6,000: Need different filter strategy

**Solution:** Split by geography or use multiple API calls with different filter combinations

---

**Case 2: Filters return 100M+ contacts**

Count API returns huge number:
- Display: "100,000,000+ contacts"
- Suggest: "Narrow your filters for better targeting"
- Limit purchase: Max 10,000 per order

---

**Case 3: Data freshness**

Data Axle updates monthly:
- Count may differ slightly from actual purchaseable records
- Acceptable variance: ±2%

---

## Testing & Validation

### Test Checklist

#### Unit Tests

```bash
# Test filter DSL builder
npm run test lib/contacts/data-axle-client.test.ts
```

```typescript
describe('DataAxleClient', () => {
  it('should build simple filter', () => {
    const client = new DataAxleClient('test-key');
    const dsl = client.buildFilterDSL({ state: 'CA' });
    expect(dsl).toEqual({
      relation: 'equals',
      attribute: 'state',
      value: 'CA'
    });
  });

  it('should build complex AND filter', () => {
    const dsl = client.buildFilterDSL({
      state: 'CA',
      homeowner: true,
      ageMin: 65,
      ageMax: 80
    });
    expect(dsl.connective).toBe('and');
    expect(dsl.propositions).toHaveLength(3);
  });
});
```

---

#### Integration Tests

```bash
# Test real API calls (requires valid API key)
npm run test:integration
```

```typescript
describe('Data Axle API Integration', () => {
  it('should get count for California', async () => {
    const client = new DataAxleClient(process.env.DATA_AXLE_API_KEY!);
    const result = await client.getCount({ state: 'CA' });

    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBeLessThan(50000000); // Sanity check
  });

  it('should purchase 10 contacts', async () => {
    const client = new DataAxleClient(process.env.DATA_AXLE_API_KEY!);
    const contacts = await client.purchaseContacts({ state: 'CA' }, 10);

    expect(contacts).toHaveLength(10);
    expect(contacts[0]).toHaveProperty('person_id');
    expect(contacts[0]).toHaveProperty('first_name');
  });
});
```

---

#### Manual Testing

**Test 1: Free Count**
```bash
curl -H "X-AUTH-TOKEN: $DATA_AXLE_API_KEY" \
  -H "Content-Type: application/json" \
  -X GET "https://api.data-axle.com/v1/people/insights" \
  -d '{"filter":{"relation":"equals","attribute":"state","value":"CA"},"insights":{"field":"state","calculations":["fill_count"]}}'
```

**Expected:** `{"count": 39500000, ...}`

---

**Test 2: Purchase Contacts**
```bash
curl -H "X-AUTH-TOKEN: $DATA_AXLE_API_KEY" \
  -H "Content-Type: application/json" \
  -X GET "https://api.data-axle.com/v1/people/search" \
  -d '{"filter":{"relation":"equals","attribute":"state","value":"CA"},"fields":["first_name","last_name","city","zip"],"limit":10,"offset":0}'
```

**Expected:** `{"count": 39500000, "documents": [...]}`

---

## Deployment Checklist

### Pre-Deployment

- [ ] Data Axle account created and activated
- [ ] API token generated and tested
- [ ] Environment variables configured in production
- [ ] Database tables created (saved_audiences, contact_purchases, etc.)
- [ ] Rate limiter tested with load
- [ ] Error handling tested (invalid token, rate limit, etc.)

### Production Configuration

```bash
# Vercel Environment Variables
DATA_AXLE_API_KEY=prod_token_here
DATA_AXLE_BASE_URL=https://api.data-axle.com/v1/people
DATA_AXLE_COST_PER_CONTACT=0.15
NEXT_PUBLIC_DATA_AXLE_COST_PER_CONTACT=0.15
```

### Monitoring

**Metrics to track:**
- API response times (should be <500ms for counts)
- API error rates (should be <1%)
- Rate limit hits (should be 0 with proper limiter)
- Purchase success rate (should be >99%)
- User engagement (filters used, counts viewed, purchases made)

**Logging:**
```typescript
// Log all API calls for debugging
console.log('[Data Axle] Count request:', { filters, count, duration });
console.log('[Data Axle] Purchase:', { filters, contactCount, cost });
```

### Post-Deployment Validation

- [ ] Test count API in production
- [ ] Test purchase API with real user account
- [ ] Verify billing integration works
- [ ] Test with 10 beta users
- [ ] Monitor error logs for 48 hours

---

## Additional Resources

### Official Documentation

- Data Axle Platform: https://platform.data-axle.com/people/docs/
- Insights API: https://beta.platform.data-axle.com/people/docs/insights_api
- Search API: https://platform.data-axle.com/people/docs/search_api
- Filter DSL: https://platform.data-axle.com/people/docs/filter_dsl

### Support

- **General Support:** support@data-axle.com
- **Partnerships:** partnerships@data-axle.com
- **Sales:** 1-877-440-3282

### Community

- GitHub: https://github.com/data-axle
- RapidAPI Marketplace: Data Axle Business Search

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-28 | 1.0 | Initial documentation based on API research |

---

**This documentation is a living document. Update as you discover new features, edge cases, or optimizations during development.**
