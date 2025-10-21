# 📦 Batch Processing Installation Steps

## Required Dependencies

Run this command to install all required packages for batch processing:

```bash
npm install bullmq ioredis puppeteer archiver nodemailer
npm install --save-dev @types/ioredis @types/nodemailer
```

## Required Services

### 1. **Redis Server** (Required for job queue)

**Windows (WSL):**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Check if running
redis-cli ping
# Should respond: PONG
```

**Windows (Native):**
Download and install from: https://github.com/microsoftarchive/redis/releases

**macOS:**
```bash
brew install redis
brew services start redis
```

### 2. **Email Configuration** (For notifications)

Add to `.env.local`:
```env
# SMTP Configuration (example with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Marketing Platform <noreply@yourplatform.com>

# Or use SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Batch Processing Configuration
BATCH_THRESHOLD=100
BATCH_WORKER_CONCURRENCY=4
BATCH_OUTPUT_DIR=./batch-output
BATCH_RETENTION_DAYS=30

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Setup Steps

### Step 1: Install Dependencies
```bash
cd /path/to/marketing-ai-demo
npm install
```

### Step 2: Run Database Migration
Start your dev server and run:
```bash
curl -X POST http://localhost:3000/api/database/migrate-batch
```

Or visit in browser: `POST http://localhost:3000/api/database/migrate-batch`

### Step 3: Start Redis
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
sudo service redis-server start  # Linux/WSL
brew services start redis         # macOS
```

### Step 4: Start Background Worker
In a **separate terminal**, run:
```bash
npm run worker
```

(We'll add this script to package.json)

### Step 5: Test the System
1. Go to DM Creative tab
2. Select a template from Template Library
3. Upload CSV with recipients
4. For <100 recipients: instant client-side processing
5. For ≥100 recipients: background job queue

## Verification Checklist

- [ ] All npm packages installed successfully
- [ ] Redis server is running (`redis-cli ping` returns `PONG`)
- [ ] Database migration completed successfully
- [ ] Environment variables configured in `.env.local`
- [ ] Background worker process started
- [ ] Test batch job created successfully

## Troubleshooting

### Redis Connection Failed
- Check if Redis is running: `redis-cli ping`
- Check port 6379 is not in use: `netstat -an | grep 6379`
- Try restarting: `sudo service redis-server restart`

### Worker Not Processing Jobs
- Check worker logs for errors
- Verify Redis connection in worker logs
- Check if jobs are being added to queue: `redis-cli KEYS batch:*`

### Email Not Sending
- Verify SMTP credentials are correct
- For Gmail, you need an "App Password" (not regular password)
- Check firewall isn't blocking SMTP port (587)

### Puppeteer Chrome Download Failed
```bash
# Manually install Chromium dependencies (Linux)
sudo apt install -y chromium-browser
```

## Next Steps After Installation

1. ✅ Test with small batch (10 recipients) - should use client-side rendering
2. ✅ Test with medium batch (500 recipients) - should create background job
3. ✅ Monitor progress in batch jobs dashboard
4. ✅ Check email notification received
5. ✅ Download ZIP and verify PDF quality

---

**Last Updated:** 2025-10-18
