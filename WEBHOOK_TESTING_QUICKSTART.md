# Webhook Testing - Quick Start Guide

**Time Required**: 10-15 minutes
**Goal**: Test real-time ElevenLabs webhook integration

---

## ✅ Prerequisites

- [x] better-sqlite3 rebuilt (you mentioned this is done)
- [x] Dev server running (`npm run dev`)
- [x] ngrok installed (just completed)
- [ ] ElevenLabs account with API access
- [ ] ElevenLabs AI agent configured

---

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Start ngrok Tunnel
```bash
./start-webhook-testing.sh
```

**What you'll see:**
```
ngrok

Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**👉 Copy your ngrok URL**: `https://abc123.ngrok.io`

---

### Step 2: Configure ElevenLabs Webhook

1. Go to https://elevenlabs.io and sign in
2. Navigate to your **Conversational AI** section
3. Select your AI agent
4. Find **Webhooks** or **Integration** settings
5. Enter your webhook URL:
   ```
   https://[YOUR-NGROK-URL]/api/webhooks/elevenlabs
   ```
   Example: `https://abc123.ngrok.io/api/webhooks/elevenlabs`
6. Save

---

### Step 3: Make Test Call

**Option A**: Use ElevenLabs dashboard test feature
**Option B**: Call your ElevenLabs phone number
**Option C**: Use web widget if available

Just have a brief conversation and hang up!

---

## 🔍 Verify It Worked

### Check 1: ngrok Web Interface
Open in browser: `http://127.0.0.1:4040`

Look for:
- ✅ POST request to `/api/webhooks/elevenlabs`
- ✅ Status 200
- ✅ Response with `"success": true`

### Check 2: Dev Server Logs
In your `npm run dev` terminal, you should see:

```
[Webhook] Received ElevenLabs webhook: {
  event: 'conversation.ended',
  conversation_id: 'conv_...',
  ...
}

[Webhook] Call stored successfully
```

### Check 3: Database
```bash
curl http://localhost:3000/api/analytics/overview
```

Look for `callMetrics.total_calls` - should be +1 from before!

---

## ✅ Success!

If you see:
- ✅ Webhook received in ngrok interface
- ✅ Logs in dev server terminal
- ✅ Call count increased in analytics

**Your webhook is working perfectly!** 🎉

---

## ❓ Having Issues?

### Webhook returns 404
- Check URL has `/api/webhooks/elevenlabs` (no trailing slash)
- Verify ngrok is still running

### No webhook received
- Check ElevenLabs webhook is saved correctly
- Try the test call again
- Check ngrok session hasn't expired (free tier has limits)

### Database error
- Verify better-sqlite3 is rebuilt
- Check dev server terminal for error details

---

## 🛑 When Done Testing

1. **Stop ngrok**: Press `Ctrl+C` in ngrok terminal
2. **Optional**: Remove webhook URL from ElevenLabs dashboard (or keep it for continued testing)
3. **Keep dev server running**: You can continue development

---

## 📊 What's Next?

After successful testing, you can:

1. **Deploy to production** and update webhook URL
2. **Build Phase 2B UI** (Calls tab, detail modal, attribution interface)
3. **Move to other features** on your roadmap

---

## 💡 Pro Tips

- **Keep ngrok running** during development for continuous webhook testing
- **View webhook traffic** at http://127.0.0.1:4040 - super useful for debugging!
- **Test error scenarios** by sending malformed data
- **Monitor rate limits** - free ngrok has connection limits

---

## 📚 Full Documentation

For detailed instructions and troubleshooting:
- See `WEBHOOK_TESTING_GUIDE.md` (complete guide)
- See `PHASE2_PROGRESS_UPDATE.md` (implementation details)
- See `CALL_TRACKING_SUMMARY.md` (full project summary)

---

**Ready to test!** Run `./start-webhook-testing.sh` to begin! 🚀
