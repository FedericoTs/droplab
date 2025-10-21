# 🔧 Worker Troubleshooting Guide

## ❌ Error: "REDIS_HOST environment variable not set"

### Solution:

1. **Create `.env.local` file** in project root (if not exists):
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and add these minimum required variables:
   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Email Configuration (Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Restart worker**:
   ```bash
   npm run worker
   ```

### Expected Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 BATCH WORKER - Marketing AI Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Started at: [timestamp]
🖥️  Node version: v20.x.x
📍 Working directory: [path]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Loaded environment variables from .env.local
🔍 Checking environment configuration...
   Redis: localhost:6379
   SMTP: smtp.gmail.com
   Output Dir: ./batch-output
   Concurrency: 4

🚀 Starting batch worker...
📊 Concurrency: 4
✅ Batch worker started successfully
👀 Waiting for jobs...
```

---

## ❌ Error: "Redis connection failed"

### Check if Redis is Running:
```bash
redis-cli ping
```

**Expected:** `PONG`

### If Redis is NOT Running:

#### Ubuntu/WSL:
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Verify
redis-cli ping
```

#### Windows (Native):
1. Download: https://github.com/microsoftarchive/redis/releases
2. Install and run Redis-x64-5.0.14.msi
3. Redis will start automatically

#### macOS:
```bash
brew install redis
brew services start redis
redis-cli ping
```

---

## ❌ Error: "Failed to start worker"

### Common Causes:

1. **Redis not running** → See above
2. **Port 6379 already in use**:
   ```bash
   # Check what's using port 6379
   netstat -an | grep 6379

   # Kill process if needed
   sudo pkill redis-server
   sudo service redis-server start
   ```

3. **Node version too old**:
   ```bash
   node --version  # Should be v18 or higher
   ```

4. **Missing dependencies**:
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## ✅ Worker is Running - How to Test?

### Test 1: Check Worker Logs
Worker should show:
```
✅ Batch worker started successfully
👀 Waiting for jobs...
```

### Test 2: Check Redis Queue
```bash
redis-cli KEYS batch:*
# Should show queue keys when jobs are added
```

### Test 3: Create Test Job
1. Go to http://localhost:3000/dm-creative
2. Select a template from library
3. Upload CSV with 150+ recipients
4. Click "Generate Direct Mails"
5. Watch worker terminal for job processing

---

## 📧 Email Not Sending?

### Gmail App Password Setup:
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Select "Mail" and "Other (Custom name)"
4. Click "Generate"
5. Copy the 16-character password (no spaces)
6. Paste into `.env.local` as `SMTP_PASS`

### Test SMTP Connection:
```bash
# From WSL/Ubuntu
curl -v telnet://smtp.gmail.com:587
```

Should connect successfully.

---

## 🐛 Still Having Issues?

### Enable Debug Mode:
```bash
# Set debug environment variable
DEBUG=* npm run worker
```

### Check Logs:
```bash
# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Check worker output
npm run worker 2>&1 | tee worker.log
```

### Verify File Permissions:
```bash
# Make sure batch-output directory exists and is writable
mkdir -p ./batch-output
chmod 755 ./batch-output
```

---

## 📊 Performance Monitoring

### Check Redis Memory:
```bash
redis-cli info memory
```

### Check Worker Process:
```bash
# Find worker process
ps aux | grep batch-worker

# Monitor CPU/Memory
top -p [worker-pid]
```

---

## 🔄 Restart Everything:

```bash
# 1. Stop worker (Ctrl+C)

# 2. Restart Redis
sudo service redis-server restart

# 3. Clear Redis queue (if needed)
redis-cli FLUSHDB

# 4. Restart worker
npm run worker
```

---

## ✅ Checklist Before Running Worker:

- [ ] `.env.local` exists with required variables
- [ ] Redis is installed and running
- [ ] `redis-cli ping` returns `PONG`
- [ ] Node version is v18 or higher
- [ ] All dependencies installed (`npm install`)
- [ ] Database migration completed (`npm run migrate:batch`)
- [ ] Dev server is running (`npm run dev`)

---

**Last Updated:** 2025-10-18
