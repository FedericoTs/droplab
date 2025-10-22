# Phase 2: ElevenLabs Call Tracking - Webhooks & UI Enhancements

**Date**: 2025-10-22
**Status**: 📋 Planning Phase
**Priority**: Medium (Phase 1 provides core value)
**Estimated Effort**: 6-8 hours
**Dependencies**: Phase 1 Complete ✅

---

## 🎯 Goals

### PRIMARY GOALS
1. **Real-time Call Tracking** via webhooks (instead of manual sync)
2. **Calls Tab UI** in campaign detail page
3. **Manual Attribution Interface** for unattributed calls

### SECONDARY GOALS (Nice to Have)
- Scheduled automatic sync (every 15 minutes)
- Call detail modal with transcript preview
- Export calls to CSV
- Call activity timeline visualization

---

## 📋 Implementation Checklist

### Step 1: Webhook Integration (3-4 hours)

#### 1.1 Create Webhook Endpoint
- [ ] Create `app/api/webhooks/elevenlabs/route.ts`
- [ ] Implement POST handler for incoming webhook calls
- [ ] Validate webhook signature (if ElevenLabs provides)
- [ ] Extract call data from webhook payload
- [ ] Store call immediately in database
- [ ] Trigger real-time analytics update (optional)

#### 1.2 Webhook Security
- [ ] Implement request verification
- [ ] Add IP whitelist validation (optional)
- [ ] Log all webhook attempts
- [ ] Handle malformed payloads gracefully

#### 1.3 ElevenLabs Configuration
- [ ] Configure webhook URL in ElevenLabs dashboard
- [ ] Test webhook with dev server (ngrok/localtunnel)
- [ ] Test webhook in production environment
- [ ] Verify webhook retry logic

#### 1.4 Fallback Strategy
- [ ] Keep API polling as backup
- [ ] Detect webhook failures
- [ ] Auto-switch to polling if webhooks fail

---

### Step 2: Calls Tab UI (2-3 hours)

#### 2.1 Create Campaign Detail Calls Tab
- [ ] Create `app/campaigns/[id]/calls/page.tsx`
- [ ] Add "Calls" tab to campaign detail page
- [ ] Design calls list component
- [ ] Implement pagination (10 calls per page)
- [ ] Add sorting (by date, duration, status)

#### 2.2 Call List Display
**Columns:**
- Date & Time
- Caller Phone Number
- Duration
- Status (Success/Failure/Unknown)
- Conversion Badge
- Attribution Status
- Actions (View Details, Attribute)

#### 2.3 Call Detail Modal
- [ ] Create modal component for call details
- [ ] Display full call metadata
- [ ] Show raw API response (JSON viewer)
- [ ] Display transcript if available
- [ ] Show attribution information
- [ ] Manual conversion toggle

#### 2.4 Empty States
- [ ] No calls yet message
- [ ] Unattributed calls warning
- [ ] Failed calls alert

---

### Step 3: Manual Attribution Interface (1-2 hours)

#### 3.1 Unattributed Calls View
- [ ] Create `app/analytics/unattributed-calls/page.tsx`
- [ ] List all calls without campaign_id
- [ ] Display caller phone number
- [ ] Show call details
- [ ] "Assign to Campaign" button

#### 3.2 Attribution Flow
- [ ] Campaign selector dropdown
- [ ] Recipient selector (optional, if known)
- [ ] Save attribution
- [ ] Update database
- [ ] Refresh analytics
- [ ] Success toast notification

#### 3.3 Bulk Attribution
- [ ] Select multiple calls
- [ ] Assign all to same campaign
- [ ] Confirmation modal
- [ ] Batch update

---

### Step 4: Scheduled Sync Job (1 hour)

#### 4.1 Cron Job Setup
**Option A: Vercel Cron**
- [ ] Create `vercel.json` with cron configuration
- [ ] Schedule sync every 15 minutes
- [ ] Test in Vercel deployment

**Option B: External Cron Service**
- [ ] Use cron-job.org or similar
- [ ] Configure to hit `/api/jobs/sync-elevenlabs-calls`
- [ ] Set API key for authentication

**Option C: Simple setInterval (Development)**
- [ ] Background service in Next.js
- [ ] Run every 15 minutes
- [ ] Only for development/testing

#### 4.2 Sync Monitoring
- [ ] Log sync results
- [ ] Track sync failures
- [ ] Email notifications on repeated failures
- [ ] Dashboard widget showing last sync time

---

### Step 5: Enhanced Analytics (Optional - 1 hour)

#### 5.1 Call Activity Timeline
- [ ] Line chart showing calls over time
- [ ] Success vs failure visualization
- [ ] Conversion rate trend
- [ ] Interactive date range selector

#### 5.2 Call Duration Analysis
- [ ] Average duration by campaign
- [ ] Duration distribution histogram
- [ ] Identify outliers (very short/long calls)

#### 5.3 Attribution Metrics
- [ ] Attribution rate percentage
- [ ] Top campaigns by call volume
- [ ] Unattributed calls count
- [ ] Attribution accuracy score

---

## 🏗️ File Structure

```
app/
├── api/
│   └── webhooks/
│       └── elevenlabs/
│           └── route.ts               [NEW] POST handler for webhooks
├── campaigns/
│   └── [id]/
│       └── calls/
│           └── page.tsx                [NEW] Calls tab UI
└── analytics/
    └── unattributed-calls/
        └── page.tsx                    [NEW] Manual attribution interface

components/
├── calls/
│   ├── call-list.tsx                   [NEW] Calls table component
│   ├── call-detail-modal.tsx           [NEW] Call details popup
│   ├── call-attribution-form.tsx       [NEW] Assign to campaign form
│   └── call-timeline-chart.tsx         [NEW] Call activity visualization
└── analytics/
    └── call-metrics-widget.tsx         [ENHANCE] Add real-time updates

lib/
└── elevenlabs/
    ├── webhook-handler.ts              [NEW] Process webhook payloads
    └── sync-scheduler.ts               [NEW] Scheduled sync logic (optional)

vercel.json                             [NEW] Cron configuration (if using Vercel)
```

---

## 🔐 Webhook Payload Structure (Expected)

Based on ElevenLabs documentation, the webhook payload should include:

```typescript
interface ElevenLabsWebhookPayload {
  event: 'conversation.ended';
  conversation_id: string;
  agent_id: string;

  // Call metadata
  start_time_unix_secs: number;
  call_duration_secs: number;
  call_successful: 'success' | 'failure' | 'unknown';

  // Phone numbers
  phone_number?: string;
  caller_phone?: string;

  // Conversation data
  transcript?: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
  };

  // Analysis
  analysis?: {
    sentiment?: string;
    intent?: string;
    outcome?: string;
  };

  // Custom metadata we passed
  metadata?: Record<string, any>;
}
```

---

## 🔄 Webhook Flow Diagram

```
1. Call completes on ElevenLabs
   ↓
2. ElevenLabs sends POST to our webhook URL
   ↓
3. Webhook endpoint validates request
   ↓
4. Extract call data from payload
   ↓
5. Attempt automatic attribution (phone matching)
   ↓
6. Store in database (upsert)
   ↓
7. Return 200 OK to ElevenLabs
   ↓
8. Analytics dashboard auto-refreshes (optional)
```

---

## 🧪 Testing Plan

### Webhook Testing
1. **Local Testing with ngrok:**
   ```bash
   ngrok http 3000
   # Use ngrok URL in ElevenLabs webhook settings
   ```

2. **Test Scenarios:**
   - Valid webhook with full data
   - Webhook with minimal data
   - Malformed payload
   - Duplicate webhooks (same conversation_id)
   - Webhook with attribution data
   - Webhook without phone number

3. **Verification:**
   - Check database for new call
   - Verify attribution accuracy
   - Confirm analytics update
   - Test retry mechanism

### UI Testing
1. **Calls Tab:**
   - Empty state
   - 1 call
   - 100+ calls (pagination)
   - Sorting by each column
   - Filter by status
   - Mobile responsiveness

2. **Manual Attribution:**
   - Single call attribution
   - Bulk attribution
   - Cancel flow
   - Validation errors
   - Success confirmation

3. **Call Details Modal:**
   - All fields populated
   - Missing fields
   - Long transcript
   - JSON viewer formatting

---

## ⚡ Performance Considerations

### Database Optimization
- Existing indexes sufficient (campaign_id, call_started_at, call_status)
- Consider composite index for common queries:
  ```sql
  CREATE INDEX idx_calls_campaign_status_date
  ON elevenlabs_calls(campaign_id, call_status, call_started_at DESC);
  ```

### Webhook Latency
- **Target**: Respond to webhook within 500ms
- Process heavy operations async
- Return 200 OK immediately
- Queue analytics updates (optional)

### UI Performance
- Paginate call lists (10-50 per page)
- Lazy load call details
- Debounce search/filter
- Cache campaign selector data

---

## 🎯 Success Criteria

### Phase 2 MVP
- [ ] Webhooks receive calls in real-time
- [ ] Calls tab displays all calls for campaign
- [ ] Manual attribution works for unattributed calls
- [ ] No impact on existing Phase 1 functionality

### Phase 2 Complete
- [ ] Scheduled sync runs every 15 minutes (backup)
- [ ] Call details modal shows full information
- [ ] Bulk attribution works
- [ ] Export calls to CSV
- [ ] Call timeline chart displays activity
- [ ] Real-time dashboard updates (optional)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Test webhooks locally with ngrok
- [ ] Verify webhook URL is accessible from internet
- [ ] Configure ElevenLabs webhook in dashboard
- [ ] Test webhook signature validation
- [ ] Deploy to staging environment

### Production Deployment
- [ ] Update webhook URL in ElevenLabs to production
- [ ] Configure environment variables
- [ ] Test first webhook in production
- [ ] Verify database writes
- [ ] Monitor webhook logs
- [ ] Set up alerts for webhook failures

### Post-Deployment
- [ ] Verify calls appearing in real-time
- [ ] Check attribution accuracy
- [ ] Monitor database performance
- [ ] Test manual attribution flow
- [ ] Verify scheduled sync (if implemented)

---

## 💡 Design Decisions

### Why Webhooks > Polling?
| Feature | Polling | Webhooks |
|---------|---------|----------|
| Latency | 15 minutes | < 1 second |
| API Calls | Every 15 min | Only on call |
| Complexity | Simple | Medium |
| Reliability | 100% | 95%+ |
| **Chosen** | ✅ Backup | ✅ Primary |

**Decision**: Use webhooks as primary, keep polling as backup.

### Why Manual Attribution UI?
- Not all calls have caller phone number
- Customers may call from different numbers
- Business may want to reassign calls
- **Value**: Ensures 100% attribution accuracy

### Why Scheduled Sync?
- **Backup** if webhooks fail
- **Safety net** for missed calls
- **Reconciliation** for data consistency
- Runs every 15 minutes (low cost)

---

## 📊 Expected Impact

### Before Phase 2 (Current)
- Manual sync required
- 15-minute delay minimum
- No UI to view calls
- Manual attribution via SQL

### After Phase 2
- ✅ Real-time call tracking (< 1 second)
- ✅ Automatic sync every 15 minutes (backup)
- ✅ Beautiful UI to view call history
- ✅ One-click manual attribution
- ✅ Export capabilities
- ✅ Better attribution accuracy

---

## 🔮 Future Enhancements (Phase 3+)

### Advanced Features
- Call recording playback
- Transcript search and analysis
- Sentiment analysis integration
- AI-powered attribution suggestions
- Call coaching insights
- Multi-agent support
- Call quality scoring
- Voice analytics integration

### Enterprise Features
- Role-based access control
- Call disposition codes
- Custom fields
- Advanced reporting
- Data retention policies
- GDPR compliance tools
- Call recording encryption

---

**Status**: 📋 Planning Complete - Ready for Implementation
**Recommendation**: Start with Webhook Integration (Step 1)
**Next Action**: Create webhook endpoint and test with ngrok
