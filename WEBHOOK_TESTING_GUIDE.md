# ElevenLabs Webhook Testing Guide - ngrok Setup

**Date**: 2025-10-22
**Purpose**: Test real-time webhook integration with ElevenLabs using ngrok
**Estimated Time**: 30-60 minutes
**Status**: 📋 Ready to Execute

---

## 🎯 Testing Goals

1. ✅ Expose local webhook endpoint to internet via ngrok
2. ✅ Configure ElevenLabs webhook URL in dashboard
3. ✅ Make test call to ElevenLabs AI agent
4. ✅ Verify webhook receives real-time notification
5. ✅ Confirm call data stored in database correctly
6. ✅ Validate payload structure matches our implementation

---

## 📋 Prerequisites Checklist

- [x] Phase 2A webhook endpoint created and tested locally
- [x] better-sqlite3 rebuilt for Windows/WSL
- [x] Dev server running on port 3000
- [ ] ngrok installed (we'll check and install if needed)
- [ ] ElevenLabs account with API access
- [ ] ElevenLabs AI agent configured
- [ ] Test phone number available

---

## 🔧 Step 1: Check/Install ngrok

### Option A: Check if ngrok is already installed
```bash
ngrok version
```

**Expected Output**: `ngrok version 3.x.x` (or similar)

### Option B: Install ngrok (if not installed)

**For Windows (WSL)**:
```bash
# Download ngrok
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**OR Download manually**:
```bash
# Download and unzip
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### Verify installation
```bash
ngrok version
```

---

## 🚀 Step 2: Start ngrok Tunnel

### 2.1 Start the tunnel
```bash
ngrok http 3000
```

**Expected Output**:
```
ngrok

Session Status                online
Account                       your-account (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 2.2 Note your ngrok URL
**Your webhook URL will be**: `https://[YOUR-SUBDOMAIN].ngrok.io/api/webhooks/elevenlabs`

Example: `https://abc123.ngrok.io/api/webhooks/elevenlabs`

### 2.3 Keep this terminal open
⚠️ **IMPORTANT**: Do not close the ngrok terminal. It must stay running during testing.

---

## 🔗 Step 3: Test Webhook Endpoint

### 3.1 Verify ngrok is working
Open a new terminal and test the public endpoint:

```bash
curl https://[YOUR-SUBDOMAIN].ngrok.io/api/webhooks/elevenlabs
```

**Expected Response**:
```json
{
  "success": true,
  "message": "ElevenLabs webhook endpoint is active",
  "endpoint": "/api/webhooks/elevenlabs",
  "methods": ["POST"],
  "version": "1.0.0"
}
```

✅ **If you see this response, ngrok is working correctly!**

### 3.2 View ngrok web interface (Optional)
Open browser: `http://127.0.0.1:4040`

This shows:
- All HTTP requests in real-time
- Request/response details
- Very useful for debugging

---

## ⚙️ Step 4: Configure ElevenLabs Webhook

### 4.1 Log in to ElevenLabs Dashboard
1. Go to https://elevenlabs.io
2. Sign in to your account
3. Navigate to your **Conversational AI** section

### 4.2 Configure Webhook Settings
1. Select your AI agent (or create one if needed)
2. Find **Webhooks** or **Integration** settings
3. Look for **Conversation End Webhook** or similar
4. Enter your ngrok webhook URL:
   ```
   https://[YOUR-SUBDOMAIN].ngrok.io/api/webhooks/elevenlabs
   ```

### 4.3 Save Configuration
- Click **Save** or **Update**
- Some dashboards may have a "Test Webhook" button - use it if available

### 4.4 Expected ElevenLabs Configuration
```
Webhook URL: https://abc123.ngrok.io/api/webhooks/elevenlabs
Events: conversation.ended
Method: POST
Content-Type: application/json
```

---

## 📞 Step 5: Make Test Call

### Option A: Test via ElevenLabs Dashboard
Some ElevenLabs accounts have a "Test Call" feature in the dashboard.

1. Use the test call feature
2. Complete a short conversation with the AI agent
3. End the call

### Option B: Call Your ElevenLabs Phone Number
1. Call the phone number assigned to your ElevenLabs agent
2. Have a brief conversation (even just "Hello" and hang up)
3. Complete the call

### Option C: Use ElevenLabs Web Widget
If you have the conversational AI widget on your site:
1. Open the widget
2. Start a conversation
3. End the conversation

---

## 🔍 Step 6: Verify Webhook Received

### 6.1 Check ngrok Web Interface
Open `http://127.0.0.1:4040` in your browser

**Look for**:
- POST request to `/api/webhooks/elevenlabs`
- Status code 200
- Request body showing call data
- Response showing success message

### 6.2 Check Terminal Logs
Look at your Next.js dev server terminal for logs:

**Expected Log Output**:
```
[Webhook] Received ElevenLabs webhook: {
  event: 'conversation.ended',
  conversation_id: 'conv_abc123...',
  agent_id: 'agent_xyz...'
}

[Webhook] Call attributed to campaign: camp_123
(or)
[Webhook] No attribution found for phone: +15551234567

[Webhook] Call stored successfully: {
  callId: 'call_abc...',
  conversation_id: 'conv_abc123...',
  duration_ms: 342
}

[Webhook Log] {
  "timestamp": "2025-10-22T...",
  "conversation_id": "conv_abc123...",
  "ip": "52.x.x.x",
  "success": true
}
```

✅ **If you see these logs, the webhook worked!**

---

## 💾 Step 7: Verify Database Storage

### 7.1 Query the database
```bash
# Using sqlite3 command line
sqlite3 marketing.db "SELECT * FROM elevenlabs_calls ORDER BY created_at DESC LIMIT 1;"
```

**OR use the sync endpoint to check**:
```bash
curl http://localhost:3000/api/analytics/overview
```

Look for updated `callMetrics`:
```json
{
  "callMetrics": {
    "total_calls": 35,  // Should be +1 from before
    "successful_calls": 28,
    "average_duration": 61,
    ...
  }
}
```

### 7.2 Verify Call Data
Check that the call record includes:
- ✅ conversation_id
- ✅ agent_id
- ✅ call_started_at (timestamp)
- ✅ call_duration_seconds
- ✅ call_status ('success', 'failure', or 'unknown')
- ✅ caller_phone_number (if available)
- ✅ raw_data (full JSON payload)
- ✅ campaign_id (if attributed)
- ✅ is_conversion (true/false)

---

## 📊 Step 8: Analyze Webhook Payload

### 8.1 Review Raw Payload in ngrok
1. Go to ngrok web interface: `http://127.0.0.1:4040`
2. Click on the POST request
3. View the "Request Body" tab
4. Copy the full JSON payload

### 8.2 Compare with Expected Structure
Our webhook expects:
```json
{
  "event": "conversation.ended",
  "conversation_id": "conv_...",
  "agent_id": "agent_...",
  "start_time_unix_secs": 1729584000,
  "call_duration_secs": 125,
  "call_successful": "success",
  "phone_number": "+15551234567",
  "caller_phone": "+15559876543",
  "transcript": { ... },  // Optional
  "analysis": { ... }     // Optional
}
```

### 8.3 Document Any Differences
If ElevenLabs sends additional fields or different field names:
- Note them in a file
- We may need to update our webhook handler
- This is exactly why we're testing first!

---

## ✅ Success Criteria

Mark each as complete:

- [ ] ngrok tunnel running successfully
- [ ] Webhook endpoint accessible via public URL
- [ ] ElevenLabs webhook configured
- [ ] Test call completed
- [ ] Webhook POST received (visible in ngrok interface)
- [ ] Webhook processed without errors
- [ ] Call data stored in database
- [ ] Call appears in analytics dashboard
- [ ] Payload structure matches our implementation
- [ ] Attribution working (if phone number matches recipient)

---

## 🐛 Troubleshooting

### Issue: ngrok command not found
**Solution**: Install ngrok (see Step 1)

### Issue: Webhook returns 404
**Cause**: Endpoint path incorrect
**Solution**: Verify URL is `https://[subdomain].ngrok.io/api/webhooks/elevenlabs` (no trailing slash)

### Issue: Webhook returns 403 Forbidden
**Cause**: Security validation failing
**Solution**:
- Check if IP whitelist is configured in .env.local
- Temporarily disable IP whitelist for testing
- Check Content-Type header is `application/json`

### Issue: Webhook returns 429 Rate Limit
**Cause**: Too many requests from same IP
**Solution**: Wait 1 minute for rate limit to reset

### Issue: Webhook returns 500 Error
**Cause**: Database error or code exception
**Solution**:
- Check dev server terminal for error logs
- Verify better-sqlite3 is rebuilt
- Check database file permissions

### Issue: Call not appearing in database
**Causes & Solutions**:
1. **Webhook not actually fired**: Check ElevenLabs dashboard logs
2. **Webhook timed out**: Check ngrok shows request completed
3. **Database write failed**: Check terminal for SQL errors
4. **Wrong conversation_id**: Verify unique conversation IDs

### Issue: Call attributed to wrong campaign
**Cause**: Phone number matches multiple recipients
**Solution**: This is expected behavior - first match wins. Use manual attribution UI later.

### Issue: Call not attributed at all
**Cause**: Phone number doesn't match any recipient
**Expected**: This is normal for new callers. Shows in "unattributed calls"

---

## 📸 Step 9: Document Results

### 9.1 Take Screenshots
Capture:
1. ngrok terminal showing tunnel running
2. ngrok web interface showing successful POST
3. Dev server terminal showing webhook logs
4. Database query showing new call record
5. Analytics dashboard showing updated call count

### 9.2 Save Payload Example
Copy the real webhook payload from ngrok and save to:
```
ELEVENLABS_WEBHOOK_PAYLOAD_EXAMPLE.json
```

This helps us:
- Verify our implementation handles real data
- Document actual field names
- Create better test cases

### 9.3 Update Testing Log
Create `WEBHOOK_TESTING_RESULTS.md` with:
- Test date/time
- ngrok URL used
- ElevenLabs agent ID
- Test call details
- Success/failure status
- Any issues encountered
- Payload differences from expected

---

## 🔄 Step 10: Cleanup (After Testing)

### 10.1 Stop ngrok
In the ngrok terminal:
```bash
Ctrl+C  # Stop the tunnel
```

### 10.2 Remove Webhook from ElevenLabs (Optional)
If you want to stop receiving webhooks:
1. Go back to ElevenLabs dashboard
2. Remove or disable the webhook URL
3. Save changes

**OR keep it running**:
- If you want to continue receiving real-time call data
- Deploy the app and update webhook URL to production

### 10.3 Keep Dev Server Running
The Next.js dev server can keep running for development.

---

## 🚀 Next Steps After Successful Test

### Option A: Deploy to Production
If webhook works perfectly:
1. Deploy app to Vercel/your hosting
2. Update ElevenLabs webhook URL to production domain
3. Remove ngrok (no longer needed)
4. Monitor production webhook logs

### Option B: Build Phase 2B UI
If webhook works, build the UI components:
1. Calls tab in campaign detail page
2. Call detail modal
3. Manual attribution interface
4. Complete Phase 2!

### Option C: Fix Issues First
If webhook has issues:
1. Document all problems found
2. Update webhook handler to fix issues
3. Re-test with ngrok
4. Repeat until working

---

## 💡 Pro Tips

1. **Keep ngrok running during development**: Useful for testing without redeploying
2. **Use ngrok web interface**: Best tool for debugging webhook issues
3. **Save successful payloads**: Create test fixtures for unit tests
4. **Monitor rate limits**: Free ngrok has connection limits
5. **Test error scenarios**: Try sending malformed payloads to test error handling

---

## 📚 Additional Resources

- ngrok Documentation: https://ngrok.com/docs
- ElevenLabs API Docs: https://elevenlabs.io/docs
- Webhook Best Practices: https://webhooks.fyi/

---

**Status**: 📋 Ready to execute
**Estimated Time**: 30-60 minutes
**Difficulty**: Medium
**Risk Level**: Low (no impact on existing functionality)

---

## Quick Start Command Reference

```bash
# 1. Check ngrok installed
ngrok version

# 2. Start ngrok tunnel
ngrok http 3000

# 3. Test endpoint (in new terminal)
curl https://[YOUR-SUBDOMAIN].ngrok.io/api/webhooks/elevenlabs

# 4. Configure ElevenLabs with URL:
# https://[YOUR-SUBDOMAIN].ngrok.io/api/webhooks/elevenlabs

# 5. Make test call and watch logs

# 6. Check database
sqlite3 marketing.db "SELECT COUNT(*) FROM elevenlabs_calls;"

# 7. Stop ngrok when done
# Ctrl+C in ngrok terminal
```

---

**Ready to proceed!** 🚀
