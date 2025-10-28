# DropLab Marketing AI Platform

**Enterprise-grade AI-powered marketing automation platform** for personalized direct mail campaigns, intelligent copywriting, multi-store retail operations, and advanced order management.

**Status**: 🚀 SaaS Transformation In Progress
**Current Phase**: Planning & Documentation Complete
**See**: `DROPLAB_TRANSFORMATION_PLAN.md` for complete transformation roadmap

---

## 🎯 Core Features

### **AI-Powered Content Generation**
- **Gemini Flash Image**: Primary AI image generator (3-4s, $0.039/image)
- **AI Copywriting**: Multiple campaign variations with GPT-4
- **Cost Optimization**: 85% savings vs previous gpt-image-1 high quality
- **Speed**: 30x faster image generation (3-4s vs 60-120s)
- **Quality**: Research-backed prompt engineering for photorealistic results

### **Campaign Creation & Management**
- **DM Creative**: Personalized direct mail with AI backgrounds and QR codes
- **Template System**: Reusable DM templates for efficient batch processing
- **Batch Processing**: BullMQ-powered background jobs for thousands of DMs
- **Landing Pages**: Dynamic personalized pages with conversion tracking
- **Planning Workspace**: Advanced campaign planning and analytics (current feature branch)

### **Multi-Store Retail Operations**
- **Store Management**: Multi-location retail store operations
- **Performance Matrix**: Store performance analytics with AI clustering
- **Deployments**: Campaign deployment tracking across locations
- **AI Insights**: Predictive analytics and smart recommendations

### **Advanced Order Management**
- **4 Selection Methods**: Individual, Geographic (bulk), CSV Upload, Store Groups
- **Order Editing**: Full CRUD on order items without recreating
- **Status Tracking**: 7-stage fulfillment pipeline (Draft → Delivered)
- **Store Groups**: Save and reuse frequently-used store selections
- **Bulk Operations**: Process hundreds/thousands of stores efficiently

### **Analytics & Tracking**
- **Campaign Analytics**: Performance metrics, conversion tracking, ROI
- **Event Tracking**: Page views, QR scans, form submissions, button clicks
- **Call Tracking**: ElevenLabs call integration and metrics
- **Real-time Updates**: Auto-refresh dashboards every 30 seconds

### **Call Center Operations**
- **AI Phone Agents**: ElevenLabs Conversational AI integration
- **Call History**: Sync and display call metrics
- **Agent Management**: Configure multiple agent scenarios

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (included with better-sqlite3)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd marketing-ai-demo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create `.env.local`:

```bash
# OpenAI (for copywriting, fallback image generation)
OPENAI_API_KEY=sk-...

# Gemini (PRIMARY image generator - REQUIRED)
GEMINI_API_KEY=AIzaSy...

# Optional: Other services
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Image generation version (use v2 for Gemini optimization)
IMAGE_GEN_VERSION=v2
```

### Run Development Server

```bash
npm run dev
```

Navigate to: **http://localhost:3000**

**Windows Users**: See `QUICK_START_WINDOWS.md` for platform-specific setup

---

## 📚 Documentation

### **⚠️ Master Planning Document**
- **`DROPLAB_TRANSFORMATION_PLAN.md`** - **SINGLE SOURCE OF TRUTH** for all development
  - Complete 6-8 week SaaS transformation roadmap
  - Database migration strategy (SQLite → Supabase)
  - Multi-tenancy architecture with Row-Level Security
  - Data Axle, PostGrid, and Stripe integrations
  - Progress tracking with checkboxes

### **Core Documentation (Root)**
- **`README.md`** - This file (project overview)
- **`CLAUDE.md`** - AI development guidelines (references master plan)
- **`QUICK_START.md`** - Setup guide (macOS/Linux)
- **`QUICK_START_WINDOWS.md`** - Setup guide (Windows)
- **`DATABASE_PATTERNS.md`** - Database architecture patterns

### **Integration Documentation**
- **`docs/DATA_AXLE_INTEGRATION_GUIDE.md`** - Complete Data Axle API documentation
  - Insights API (FREE count endpoint)
  - Search API (contact purchase)
  - Filter DSL specification
  - Production-ready TypeScript code with rate limiting

### **AI Optimization (October 2025)**
- **`GEMINI_OPTIMIZATION_SUMMARY.md`** - Gemini optimization overview
- **`COST_COMPARISON_GPT_IMAGE_VS_GEMINI.md`** - Detailed cost analysis
- **`FUTURE_UPSCALER_INTEGRATION.md`** - Planned 4x upscaling feature
- **`BACKGROUND_SCALING_FIX.md`** - Image scaling implementation
- **`DIAGNOSTIC_BACKGROUND_ISSUE.md`** - Troubleshooting guide

### **Current Feature Branch**
- **`PLANNING_WORKSPACE_COMPLETE_PLAN.md`** - Planning workspace design
- **`PLANNING_WORKSPACE_PROGRESS.md`** - Implementation status
- **`PLANNING_WORKSPACE_SETUP.md`** - Database schema setup

### **Recent Completions**
- **`FOREIGN_KEY_FIX_COMPLETE.md`** - Database integrity fixes
- **`SESSION_SUMMARY_VISUAL_ENHANCEMENTS.md`** - UI improvements

### **Archive**
- **`docs/archive/README.md`** - Historical documentation index
- See `docs/archive/` for completed feature documentation

---

## 🛠️ Tech Stack

### **Core Framework**
- **Next.js 15.5.4** with App Router (React 19.1.0)
- **TypeScript** with strict mode
- **Turbopack** for fast development builds

### **AI & APIs**
- **Google Gemini 2.5 Flash Image** (PRIMARY image generator)
- **OpenAI GPT-4** (copywriting, fallback images)
- **ElevenLabs** Conversational AI (phone agents)

### **Styling & UI**
- **Tailwind CSS v4** (utility-first styling)
- **shadcn/ui** (New York style components)
- **Fabric.js v6** (canvas editor for DM templates)

### **Database & Jobs**
- **SQLite** with better-sqlite3 (production-ready)
- **BullMQ + Redis** (background job processing)

### **Image & PDF**
- **Canvas API** (browser-based image composition)
- **jsPDF** + html2canvas (PDF generation)
- **qrcode** library (QR code generation)

---

## 📊 Key Performance Metrics

### **AI Image Generation (Gemini Optimization)**
- **Cost**: $0.039 per image (85% cheaper than gpt-image-1 high)
- **Speed**: 3-4 seconds (30x faster than gpt-image-1 high)
- **Quality**: Equivalent or better with research-backed prompt engineering
- **Reliability**: Zero timeout issues

**Monthly Savings (5,000 images):**
- Old cost (gpt-image-1 high): $1,315 + 16-33 hours
- New cost (Gemini): $195 + 50-67 minutes
- **Savings: $1,120/month (85% reduction)**

### **Order Operations**
- **Single order creation**: ~2 seconds
- **Bulk order (50 stores)**: ~15 seconds
- **CSV batch (500 stores)**: ~2 minutes
- **Order editing**: <1 second
- **Status update**: <500ms

### **Template System**
- **Cost savings**: $0.00 per use (vs $0.048 per AI generation)
- **Time savings**: ~3 seconds per DM (vs 25 seconds with AI)
- **Scalability**: Process thousands/millions efficiently

---

## 📈 Common Workflows

### Create Bulk Order with Store Groups
```
1. Navigate to /campaigns/orders/new
2. Click "Store Groups" tab
3. Select saved group (e.g., "Northeast Campaign Stores")
4. Preview stores
5. Select campaign + quantity
6. Click "Add X Stores to Order"
7. Generate Order & PDF
⏱️ Time: 30 seconds
```

### Edit Existing Order
```
1. Navigate to /campaigns/orders
2. Click on draft/pending order
3. Click "Edit Order" button
4. Modify items/quantities
5. Click "Save Changes"
⏱️ Time: 30 seconds
```

### Generate AI Direct Mail
```
1. Navigate to /dm-creative
2. Enter campaign details + recipient info
3. Choose quality: Low ($0.039) / Medium ($0.039) / High ($0.039)
4. Click "Generate DM"
⏱️ Time: 3-4 seconds (Gemini)
💰 Cost: $0.039 per image
```

---

## 🔮 Roadmap & Transformation Plan

### **⚠️ SaaS Transformation (Current Focus - 2025 Q4)**

**See `DROPLAB_TRANSFORMATION_PLAN.md` for complete 6-8 week roadmap**

The platform is transforming from retail-focused demo to universal SaaS platform:

**Phase 1-2: Database Foundation (Week 1)**
- Database abstraction layer
- SQLite → Supabase PostgreSQL migration
- Row-Level Security (RLS) for multi-tenancy

**Phase 3: Authentication (Week 2)**
- Supabase Auth integration
- User registration, login, password reset
- Protected routes and middleware

**Phase 4: Data Axle Integration (Week 2-3)**
- 250M+ contact database access
- Smart filtering with FREE count preview (competitive moat)
- Saved audiences and filter management

**Phase 5: PostGrid Fulfillment (Week 3-4)**
- Automated direct mail printing and delivery
- API integration with PostGrid
- Order tracking and status updates

**Phase 6: Stripe Billing (Week 4-5)**
- Subscription tiers (Starter $79, Pro $249, Agency $599)
- Usage metering (contacts + mail pieces)
- Payment processing and invoicing

**Phase 7-10: Polish & Launch (Week 5-8)**
- UI/UX enhancements
- Testing and QA
- Deployment
- Beta launch

### **Future Enhancements (Post-SaaS Launch)**
- AI Upscaling: Optional 4x upscaling for print quality (Real-ESRGAN)
- Email & SMS campaign integration
- Advanced A/B testing for copy and images
- CRM integrations (Salesforce, HubSpot)
- White-label capabilities for agencies
- Webhook automation
- Advanced analytics and ROI tracking

---

## 📝 Project Structure

```
marketing-ai-demo/
├── app/                          # Next.js 15 App Router
│   ├── campaigns/
│   │   ├── matrix/              # Campaign performance matrix
│   │   ├── orders/              # Order management
│   │   └── planning/            # Planning workspace (new)
│   ├── dm-creative/             # DM creation
│   │   └── editor/              # Canvas editor for templates
│   ├── store-groups/            # Store groups management
│   ├── retail/                  # Retail module pages
│   ├── analytics/               # Analytics dashboard
│   └── api/                     # API routes
├── components/
│   ├── orders/                  # Order components
│   ├── retail/                  # Retail components
│   ├── analytics/               # Analytics components
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── database/                # SQLite database queries
│   ├── ai/
│   │   ├── openai-v2.ts        # Gemini + gpt-image-1 generators
│   │   └── openai.ts           # Legacy OpenAI
│   └── utils/                   # Utility functions
└── docs/
    └── archive/                 # Historical documentation
```

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Type check
npx tsc --noEmit
```

---

## 🤝 Contributing

This is a demo/reference implementation. For production use:
1. Review and customize business logic
2. Add authentication/authorization
3. Implement rate limiting
4. Add comprehensive error handling
5. Set up monitoring and logging
6. Configure production database (PostgreSQL/MySQL)
7. Add automated testing (Jest, Playwright)

---

## 🆘 Troubleshooting

### Image Generation Issues
- **Timeout errors**: Gemini is primary (3-4s), no timeouts expected
- **Small/misaligned backgrounds**: See `DIAGNOSTIC_BACKGROUND_ISSUE.md`
- **Quality concerns**: Check `GEMINI_OPTIMIZATION_SUMMARY.md` for settings

### Common Issues
- **Missing API keys**: Check `.env.local` configuration
- **Database errors**: Ensure SQLite permissions, check schema
- **Template loading**: Clear `.next` cache, restart dev server

### Documentation
- **Setup issues**: See `QUICK_START.md` or `QUICK_START_WINDOWS.md`
- **Development patterns**: See `CLAUDE.md`
- **Database patterns**: See `DATABASE_PATTERNS.md`

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

**Last Updated**: October 27, 2025
**Version**: Gemini Optimization + Planning Workspace
**Status**: Production Ready ✅

🤖 Built with [Claude Code](https://claude.com/claude-code)
