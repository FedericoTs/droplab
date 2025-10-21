# ⚡ QUICK START GUIDE - Batch Processing System

**Goal:** Get the batch processing system running in under 10 minutes

---

## 🚀 **STEP 1: Install Redis** (2 minutes)

```bash
# Install Redis on WSL/Ubuntu
sudo apt update
sudo apt install redis-server -y

# Start Redis
sudo service redis-server start

# Verify it's running (should return "PONG")
redis-cli ping
```

**✅ Checkpoint:** `redis-cli ping` returns `PONG`

---

## 📧 **STEP 2: Configure Email** (3 minutes)

Create `.env.local` in project root:

```bash
# Copy template
cp .env.local.example .env.local

# Or manually create and edit
# Windows: notepad .env.local
# Linux/Mac: nano .env.local
```

**IMPORTANT:** Add AT MINIMUM these lines to `.env.local`:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=Marketing Platform <noreply@marketingplatform.com>

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Batch Configuration
NEXT_PUBLIC_BATCH_THRESHOLD=100
BATCH_WORKER_CONCURRENCY=4
BATCH_OUTPUT_DIR=./batch-output
BATCH_RETENTION_DAYS=30

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**📌 Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Create new app password for "Mail"
3. Copy the 16-character password
4. Paste into `SMTP_PASS`

**✅ Checkpoint:** `.env.local` file exists with valid SMTP credentials

---

## 🗄️ **STEP 3: Run Database Migration** (1 minute)

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run migration
npm run migrate:batch
```

**Expected Output:**
```
📦 Initializing batch job tables...
✅ batch_jobs table created
✅ batch_job_recipients table created
✅ batch_job_progress table created
✅ user_notifications table created
✅ Indexes created
🎉 Batch job tables initialized successfully!
```

**✅ Checkpoint:** No errors, all tables created

---

## ⚙️ **STEP 4: Start Background Worker** (1 minute)

```bash
# In a NEW terminal (keep dev server running)
npm run worker
```

**Expected Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 BATCH WORKER - Marketing AI Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Started at: [timestamp]
🖥️  Node version: v20.x.x
📍 Working directory: [path]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Starting batch worker...
📊 Concurrency: 4
✅ Batch worker started successfully
👀 Waiting for jobs...
```

**✅ Checkpoint:** Worker running, no errors

---

## 🧪 **STEP 5: Test the System** (3 minutes)

### Test 1: Small Batch (Existing Flow)

1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/dm-creative
3. Go to **Template Library** tab
4. Select any template
5. Go back to **DM Creative** tab → **Batch Upload** tab
6. Download CSV template
7. Edit CSV with 5-10 test recipients
8. Upload CSV
9. Click "Generate Direct Mails"

**Expected:**
- Processing starts immediately
- Progress bar shows
- PDFs generated in 1-2 minutes
- Download buttons appear

### Test 2: Large Batch (New Background Queue)

1. Create CSV with 150 recipients
2. Upload to batch tab
3. Click "Generate"

**Expected:**
- Toast: "Batch job created! Processing in background..."
- Redirect to `/batch-jobs/[id]` (dashboard - TO BE CREATED)
- Worker logs show job processing
- Email sent when complete

---

## 📊 **VERIFY EVERYTHING WORKS**

### Check 1: Redis is Connected
```bash
redis-cli KEYS batch:*
# Should show queue keys if jobs are running
```

### Check 2: Worker is Processing
```bash
# Check worker terminal
# Should see job processing logs
```

### Check 3: Database Has Jobs
```bash
sqlite3 marketing.db "SELECT * FROM batch_jobs;"
# Should show batch jobs if any created
```

### Check 4: Email Test
```bash
# Create a test batch with your email
# Check inbox for completion notification
```

---

## 🐛 **TROUBLESHOOTING**

### Problem: Redis Not Starting
```bash
# Check status
sudo service redis-server status

# Restart
sudo service redis-server restart

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

### Problem: Worker Crashes
```bash
# Check Node version (needs v18+)
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Run worker with debug
DEBUG=* npm run worker
```

### Problem: Email Not Sending
```bash
# Test SMTP connection
curl -v telnet://smtp.gmail.com:587

# Verify credentials in .env.local
cat .env.local | grep SMTP

# Test email service (create test script)
# Coming soon: npm run test:email
```

### Problem: Puppeteer Chrome Missing
```bash
# Install Chromium
sudo apt install chromium-browser

# Or download manually
npx puppeteer browsers install chrome
```

---

## 📁 **PROJECT STRUCTURE**

```
marketing-ai-demo/
├── lib/
│   ├── database/
│   │   ├── init-batch-tables.ts       ✅ Created
│   │   └── batch-job-queries.ts       ✅ Created
│   ├── queue/
│   │   ├── config.ts                  ✅ Created
│   │   ├── batch-job-queue.ts         ✅ Created
│   │   └── batch-worker.ts            ✅ Created
│   ├── batch-processor/
│   │   ├── canvas-renderer-puppeteer.ts  ✅ Created
│   │   └── batch-orchestrator.ts      ✅ Created
│   └── email/
│       └── email-service.ts           ✅ Created
├── app/
│   └── api/
│       └── batch-jobs/
│           ├── create/route.ts        ✅ Created
│           └── [id]/
│               ├── route.ts           ✅ Created
│               ├── progress/route.ts  ✅ Created
│               └── download/route.ts  ✅ Created
├── batch-output/                      📂 Generated
│   └── [job-id]/
│       ├── dm-*.pdf
│       └── batch-*.zip
└── .env.local                         ⚙️ Configure
```

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Redis installed and running (`redis-cli ping` = PONG)
- [ ] `.env.local` configured with SMTP credentials
- [ ] Database migration completed successfully
- [ ] Background worker running without errors
- [ ] Dev server running on http://localhost:3000
- [ ] Test batch of 10 recipients processed successfully
- [ ] Worker logs show job processing
- [ ] PDFs generated and downloadable

---

## 🎯 **NEXT ACTIONS**

Once everything is running:

1. **Complete CSV Uploader Integration**
   - Finish smart routing logic
   - Add template banner UI
   - Test both small and large batches

2. **Create Batch Jobs Dashboard**
   - List all jobs
   - Show real-time progress
   - Download results

3. **Production Testing**
   - Test with 100 recipients
   - Test with 1,000 recipients
   - Monitor performance

---

## 🆘 **NEED HELP?**

Check these files for detailed information:
- `BATCH_PROCESSING_IMPLEMENTATION_PLAN.md` - Full architecture
- `IMPLEMENTATION_STATUS.md` - Current progress
- `INSTALLATION_STEPS.md` - Detailed setup

---

**Last Updated:** 2025-10-18
**Status:** 90% Complete - Ready for Testing! 🚀
