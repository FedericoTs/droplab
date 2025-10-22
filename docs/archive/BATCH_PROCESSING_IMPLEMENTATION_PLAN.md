# 🚀 SCALABLE BATCH PROCESSING IMPLEMENTATION PLAN

## 📋 OVERVIEW

**Goal:** Enable background batch processing of millions of DM creatives with template support, real-time progress tracking, and email notifications.

**Current Issue:** Batch CSV upload bypasses template system, generates basic PDFs instead of template-based designs.

**Solution:** Implement hybrid approach with job queue system for scalable background processing.

---

## 🏗️ ARCHITECTURE

### **Hybrid Approach:**

```
Small Batches (<100 recipients)  → Client-side rendering (instant, simple)
Large Batches (≥100 recipients)  → Background job queue (scalable, resilient)
```

### **Technology Stack:**

- **Queue System:** BullMQ (Redis-based)
- **Canvas Rendering:** Puppeteer (server-side HTML → Canvas → Image)
- **Progress Tracking:** Redis (real-time) + SQLite (persistence)
- **Email:** Nodemailer (SMTP) or SendGrid
- **File Storage:** Local filesystem → ZIP archives
- **Real-time Updates:** Server-Sent Events (SSE) or polling

---

## 📊 DATABASE SCHEMA

### **New Tables:**

```sql
-- Batch Jobs Table
CREATE TABLE IF NOT EXISTS batch_jobs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  template_id TEXT,                    -- DM template used for batch
  user_email TEXT,                     -- For completion notifications
  status TEXT DEFAULT 'pending',       -- pending, processing, completed, failed, cancelled
  total_recipients INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  output_zip_path TEXT,                -- Path to generated ZIP file
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (template_id) REFERENCES dm_templates(id)
);

-- Batch Job Recipients (tracks each recipient in a batch)
CREATE TABLE IF NOT EXISTS batch_job_recipients (
  id TEXT PRIMARY KEY,
  batch_job_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,          -- Links to recipients table
  status TEXT DEFAULT 'pending',       -- pending, processing, completed, failed
  pdf_path TEXT,                       -- Path to generated PDF
  error_message TEXT,
  processed_at TEXT,
  FOREIGN KEY (batch_job_id) REFERENCES batch_jobs(id),
  FOREIGN KEY (recipient_id) REFERENCES recipients(id)
);

-- Batch Job Progress (real-time progress snapshots)
CREATE TABLE IF NOT EXISTS batch_job_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_job_id TEXT NOT NULL,
  progress_percent REAL NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_job_id) REFERENCES batch_jobs(id)
);

-- User Notifications (for email alerts)
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,     -- batch_complete, batch_failed
  batch_job_id TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_job_id) REFERENCES batch_jobs(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_job_recipients_status ON batch_job_recipients(batch_job_id, status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_email ON user_notifications(user_email, read_at);
```

---

## 🔧 IMPLEMENTATION PHASES

### **Phase 1: Database Setup**
**Files to create:**
- `lib/database/batch-job-queries.ts` - CRUD operations for batch jobs
- `lib/database/init-batch-tables.ts` - Table creation script

**Tasks:**
- [x] Design database schema
- [ ] Create migration script for new tables
- [ ] Write query functions (create, update, get job status)
- [ ] Test with sample data

---

### **Phase 2: Queue Infrastructure**
**Dependencies to install:**
```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

**Files to create:**
- `lib/queue/config.ts` - Redis + BullMQ configuration
- `lib/queue/batch-job-queue.ts` - Job queue management
- `lib/queue/batch-worker.ts` - Background worker process

**Tasks:**
- [ ] Setup Redis connection (check if Redis installed)
- [ ] Create job queue with BullMQ
- [ ] Define job payload structure
- [ ] Implement job retry logic (3 retries with exponential backoff)
- [ ] Add job failure handling

**Job Payload Structure:**
```typescript
interface BatchJobPayload {
  batchJobId: string;
  campaignId: string;
  templateId?: string;          // Template to use
  recipients: Array<{
    recipientId: string;
    trackingId: string;
    name: string;
    lastname: string;
    address?: string;
    city?: string;
    zip?: string;
    message: string;
    phoneNumber: string;
    qrCodeDataUrl: string;
  }>;
  userEmail?: string;
  settings: {
    companyName: string;
    industry?: string;
    brandVoice?: string;
  };
}
```

---

### **Phase 3: Server-Side Canvas Rendering**
**Dependencies to install:**
```bash
npm install puppeteer
npm install archiver                   # For ZIP creation
```

**Files to create:**
- `lib/canvas-template-renderer-server.ts` - Server-side template rendering
- `lib/batch-pdf-generator.ts` - Batch PDF creation with progress tracking

**Approach: Puppeteer + HTML Canvas**
- Generate HTML page with canvas element
- Load template canvas JSON in browser context
- Use Fabric.js in headless browser
- Render to base64 image
- Generate PDF with jsPDF

**Why Puppeteer over node-canvas:**
- ✅ No native dependencies (works on Windows/Mac/Linux)
- ✅ Can reuse existing Fabric.js client code
- ✅ True browser rendering (perfect fidelity)
- ⚠️ Higher memory usage (mitigated with worker pool)

**Tasks:**
- [ ] Create HTML template with Fabric.js
- [ ] Implement `renderTemplateWithPuppeteer()`
- [ ] Add progress callbacks
- [ ] Optimize memory usage (reuse browser instances)
- [ ] Test with sample template

---

### **Phase 4: Batch Job Processor**
**Files to create:**
- `lib/batch-processor/batch-orchestrator.ts` - Main processing logic
- `lib/batch-processor/progress-tracker.ts` - Redis-based progress tracking

**Processing Flow:**
```
1. Receive job from queue
2. Update status: 'processing'
3. Load template from database (if provided)
4. For each recipient (1 to N):
   a. Load template canvas JSON
   b. Apply variable mappings
   c. Replace recipient data (name, address, QR code)
   d. Render canvas to image (Puppeteer)
   e. Generate PDF
   f. Save PDF to disk
   g. Update progress in Redis + DB
   h. Yield control (avoid blocking)
5. Create ZIP archive of all PDFs
6. Update status: 'completed'
7. Send email notification
8. Clean up temporary files (optional: keep for 7 days)
```

**Progress Tracking:**
```typescript
// Redis key: batch:job:{jobId}:progress
{
  current: 1523,
  total: 50000,
  percent: 3.046,
  currentRecipientName: "John Doe",
  estimatedTimeRemaining: "2h 15m",
  lastUpdated: "2025-10-18T12:34:56Z"
}
```

**Tasks:**
- [ ] Implement main orchestrator loop
- [ ] Add real-time progress updates to Redis
- [ ] Implement ZIP archive creation
- [ ] Add error handling + retry logic
- [ ] Memory management (process batches of 100)

---

### **Phase 5: Real-Time Progress UI**
**Files to create:**
- `app/api/batch-jobs/progress/route.ts` - SSE endpoint for live updates
- `app/batch-jobs/page.tsx` - Batch jobs dashboard
- `components/batch-jobs/batch-job-card.tsx` - Individual job status card
- `components/batch-jobs/progress-bar.tsx` - Animated progress bar

**UI Features:**
- Live progress bar with percentage
- Current recipient being processed
- Estimated time remaining
- Success/failure counts
- Download button (when complete)
- Cancel button (if processing)

**Real-Time Updates Options:**

**Option A: Server-Sent Events (SSE)** ✅ Recommended
```typescript
// Client subscribes to SSE stream
const eventSource = new EventSource('/api/batch-jobs/progress?jobId=abc123');
eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  updateUI(progress);
};
```

**Option B: Polling** (Fallback)
```typescript
// Poll every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const progress = await fetch(`/api/batch-jobs/${jobId}/progress`);
    updateUI(await progress.json());
  }, 2000);
  return () => clearInterval(interval);
}, [jobId]);
```

**Tasks:**
- [ ] Create SSE endpoint
- [ ] Build batch jobs dashboard page
- [ ] Add real-time progress bar component
- [ ] Implement auto-refresh on completion
- [ ] Add download ZIP button

---

### **Phase 6: Email Notifications**
**Dependencies to install:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Marketing Platform <noreply@yourplatform.com>
```

**Files to create:**
- `lib/email/email-service.ts` - Email sending service
- `lib/email/templates/batch-complete.ts` - Completion email template
- `lib/email/templates/batch-failed.ts` - Failure email template

**Email Templates:**

**Batch Complete:**
```
Subject: ✅ Your batch of 5,000 DMs is ready!

Hi there,

Great news! Your batch job "Summer Campaign 2025" has been completed successfully.

📊 Summary:
- Total: 5,000 recipients
- Success: 4,998 (99.96%)
- Failed: 2 (0.04%)

📥 Download your DMs:
[Download ZIP (245 MB)]

🔗 View Details:
https://yourplatform.com/batch-jobs/abc123

---
Marketing AI Platform
```

**Batch Failed:**
```
Subject: ❌ Batch job failed: Summer Campaign 2025

Hi there,

Unfortunately, your batch job "Summer Campaign 2025" has failed.

❌ Error: Template not found (ID: xyz789)

📊 Progress before failure:
- Processed: 1,234 / 5,000 (24.68%)
- Success: 1,234
- Failed: 0

🔧 What to do next:
1. Check that your template still exists
2. Retry the batch job
3. Contact support if the issue persists

🔗 View Details:
https://yourplatform.com/batch-jobs/abc123

---
Marketing AI Platform
```

**Tasks:**
- [ ] Setup nodemailer with SMTP
- [ ] Create email templates
- [ ] Implement send functions
- [ ] Test with sample emails
- [ ] Add unsubscribe option (optional)

---

### **Phase 7: Smart Batch Routing**
**Files to modify:**
- `components/dm-creative/csv-uploader.tsx` - Add threshold logic

**Routing Logic:**
```typescript
const BATCH_THRESHOLD = 100; // Configurable threshold

const handleGenerateBatch = async () => {
  if (recipients.length < BATCH_THRESHOLD) {
    // SMALL BATCH: Client-side rendering (instant)
    await handleClientSideBatch();
  } else {
    // LARGE BATCH: Background job queue
    await handleServerSideBatch();
  }
};
```

**User Experience:**
```
Small Batch (< 100):
✅ "Generating 45 DMs..." → Progress bar → "Done! Download PDFs"
Time: 30-60 seconds

Large Batch (≥ 100):
✅ "Batch job created! Processing in background..."
→ Redirect to batch jobs dashboard
→ Email notification when complete
Time: Minutes to hours (depending on size)
```

**Tasks:**
- [ ] Add threshold configuration
- [ ] Implement client-side batch renderer (for small batches)
- [ ] Implement server-side job creation (for large batches)
- [ ] Add user notification/redirect logic
- [ ] Test both paths

---

### **Phase 8: Batch Jobs Dashboard**
**Files to create:**
- `app/batch-jobs/page.tsx` - Main dashboard
- `app/batch-jobs/[id]/page.tsx` - Individual job details page
- `components/batch-jobs/job-list.tsx` - List of all jobs
- `components/batch-jobs/job-details.tsx` - Detailed job view

**Dashboard Features:**
- List all batch jobs (with filters: status, date)
- Real-time status updates
- Download button for completed jobs
- Retry button for failed jobs
- Cancel button for running jobs
- Delete old jobs

**Job Details Page:**
- Overall progress
- List of recipients with individual status
- Failed recipients with error messages
- Download individual PDFs
- Download entire ZIP

**Tasks:**
- [ ] Create dashboard UI
- [ ] Add filtering and sorting
- [ ] Implement download functionality
- [ ] Add job management (cancel, retry, delete)
- [ ] Test with multiple concurrent jobs

---

### **Phase 9: Integration & Testing**
**Testing Plan:**

1. **Small Batch (10 recipients):**
   - Select template → Upload CSV → Verify client-side rendering
   - Check PDFs match template design
   - Time: < 30 seconds

2. **Medium Batch (500 recipients):**
   - Upload CSV → Verify job creation
   - Monitor progress in real-time
   - Check email notification received
   - Download ZIP and verify quality
   - Time: 5-10 minutes

3. **Large Batch (10,000 recipients):**
   - Upload CSV → Verify background processing
   - Monitor progress over time
   - Verify no memory leaks
   - Check ZIP file integrity
   - Time: 1-2 hours

4. **Stress Test (100,000 recipients):**
   - Test system under heavy load
   - Monitor Redis memory usage
   - Check disk space management
   - Verify email delivery
   - Time: 10-20 hours

**Tasks:**
- [ ] Write unit tests for core functions
- [ ] Test with 10, 100, 1000, 10000 recipients
- [ ] Test concurrent jobs (multiple batches at once)
- [ ] Test failure scenarios (Redis down, disk full, template missing)
- [ ] Performance optimization

---

## 🔐 SECURITY & PERFORMANCE

### **Security:**
- Validate user permissions before job creation
- Sanitize file names to prevent path traversal
- Limit ZIP file size (e.g., 5 GB max)
- Auto-delete old jobs after 30 days
- Rate limiting on batch job creation

### **Performance:**
- Worker pool: 4 concurrent Puppeteer instances
- Batch processing: 100 recipients per transaction
- Redis caching for template JSON
- Lazy PDF generation (on-demand download)
- Cleanup old files weekly

---

## 📈 MONITORING & OBSERVABILITY

**Metrics to Track:**
- Jobs created per day
- Average processing time per recipient
- Success/failure rates
- Memory usage per worker
- Redis memory usage
- Disk space usage

**Logging:**
```typescript
console.log(`[BatchJob ${jobId}] Processing recipient ${current}/${total}`);
console.error(`[BatchJob ${jobId}] Failed: ${error.message}`);
console.info(`[BatchJob ${jobId}] Completed in ${duration}ms`);
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Prerequisites:**
- [ ] Redis server installed and running
- [ ] Puppeteer dependencies installed (`chromium-browser` on Linux)
- [ ] SMTP credentials configured
- [ ] Sufficient disk space for output files
- [ ] Background worker process running

### **Environment Variables:**
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Marketing Platform <noreply@yourplatform.com>

# Batch Processing Configuration
BATCH_THRESHOLD=100
BATCH_WORKER_CONCURRENCY=4
BATCH_OUTPUT_DIR=/var/www/batch-output
BATCH_RETENTION_DAYS=30
```

### **Startup Commands:**
```bash
# Start Redis (if not running)
redis-server

# Start Next.js app
npm run dev

# Start background worker (separate terminal)
node lib/queue/batch-worker.js
```

---

## 📝 NOTES

- All existing functionality remains unchanged
- Small batches continue to work instantly
- Large batches automatically routed to background queue
- Template selection flow unchanged (localStorage pattern)
- Backward compatible with existing CSV structure

---

## ✅ SUCCESS CRITERIA

1. ✅ Batch processing handles 1M+ recipients
2. ✅ User can navigate away while batch processes
3. ✅ Real-time progress visible in dashboard
4. ✅ Email notification on completion
5. ✅ Generated PDFs match template design exactly
6. ✅ No impact on existing single DM creation
7. ✅ System remains responsive during batch processing
8. ✅ Failed jobs can be retried

---

**Implementation Start Date:** 2025-10-18
**Estimated Completion:** 5-7 days (full-time development)
**Priority:** HIGH

---

*This document serves as the master reference for the batch processing implementation. Update as development progresses.*
