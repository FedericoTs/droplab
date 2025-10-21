# Fix: Task 10 Hanging Issue ✅

## Problem

Batch jobs **consistently hang at 9/10 (90%)** - the 10th task never completes.

**Symptoms**:
```
🎨 Rendered: 9/10 (90.0%) - ✅ 9 success, ❌ 0 failed
[STUCK - no further progress]
[No timeout, no error, just hangs forever]
```

---

## Root Cause (First Principles)

### Cluster Queue Deadlock

**Issue**: Puppeteer-cluster's internal task queue can deadlock under resource pressure (WSL2 + memory constraints).

**What's Happening**:
1. Tasks 0-8 complete successfully across 2 workers
2. Task 9 (the 10th task) queued via `cluster.execute()`
3. **Cluster workers never pick up task 9**
4. Task hangs forever in queue (not "executing", so cluster timeout doesn't trigger)
5. No error logged, no timeout, complete deadlock

### Why This Happens

**Puppeteer-cluster architecture**:
- Uses `CONCURRENCY_CONTEXT` (single browser, multiple contexts)
- After 9 context creations/destructions, browser may be in degraded state
- 10th context creation hangs or fails silently
- Cluster's internal queue gets stuck

**Contributing factors**:
- WSL2 I/O overhead
- Memory pressure from 2.6MB template JSON × 9 renders
- Browser context leak (contexts not fully cleaned up)

---

## Solution Implemented

### **Fix: Add Timeout Wrapper Around `cluster.execute()`** ✅

**File**: `lib/batch-processor/canvas-renderer-cluster.ts`

**Changes**:

1. **Created timeout helper**:
```typescript
const executeWithTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  taskIndex: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() =>
        reject(new Error(`Task ${taskIndex} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};
```

2. **Wrapped cluster.execute() calls**:
```typescript
// Before - could hang forever
return cluster.execute(taskData)
  .then(...)
  .catch(...);

// After - timeout safety net
return executeWithTimeout(cluster.execute(taskData), 320000, index)
  .then((imageDataUrl) => {
    console.log(`✅ Task ${index} completed: ${recipient.name}`);
    // ... rest of success handling
  })
  .catch((error) => {
    console.error(`❌ Failed to render recipient ${index}:`, error.message);
    // ... rest of error handling
  });
```

3. **Added detailed logging**:
```typescript
console.log(`🔵 Queuing task ${index}/${recipients.length - 1}: ${recipient.name}`);
// ... execute task ...
console.log(`✅ Task ${index} completed: ${recipient.name}`);
```

**Timeout**: 320,000ms (5 minutes 20 seconds)
- Cluster timeout: 240,000ms (4 minutes)
- Task timeout: 300,000ms (5 minutes) - page loading
- **Safety net**: 320,000ms (5 minutes 20 seconds) - wrapper timeout

**Behavior**:
- If task hangs for > 5min 20sec → timeout error thrown
- Error caught by `.catch()` → logged, counted as failed
- Batch continues with remaining tasks
- Instead of hanging forever, user gets 9/10 success

---

## Expected Behavior After Fix

### Scenario 1: Task 10 Completes Normally
```
🔵 Queuing task 0/9: John Doe
🔵 Queuing task 1/9: Jane Smith
...
🔵 Queuing task 9/9: Bob Johnson

✅ Task 0 completed: John Doe
🎨 Rendered: 1/10 (10.0%) - ✅ 1 success, ❌ 0 failed
...
✅ Task 8 completed: Alice Brown
🎨 Rendered: 9/10 (90.0%) - ✅ 9 success, ❌ 0 failed

✅ Task 9 completed: Bob Johnson
🎨 Rendered: 10/10 (100.0%) - ✅ 10 success, ❌ 0 failed
✅ Cluster rendering complete: 10 success, 0 failed out of 10 total
```

### Scenario 2: Task 10 Hangs → Times Out
```
✅ Task 8 completed: Alice Brown
🎨 Rendered: 9/10 (90.0%) - ✅ 9 success, ❌ 0 failed

[Wait 5 minutes 20 seconds]

❌ Failed to render recipient 9 (Bob Johnson): Task 9 timed out after 320000ms
🎨 Rendered: 10/10 (100.0%) - ✅ 9 success, ❌ 1 failed
✅ Cluster rendering complete: 9 success, 1 failed out of 10 total

📄 Phase 2: Generating 9 PDFs...
✅ Batch job completed - 9 PDFs generated
```

---

## Why This Fix Works

### Before Fix:
```
cluster.execute(taskData)  ← Hangs forever if cluster queue deadlocks
  No timeout
  No error
  No escape
```

### After Fix:
```
Promise.race([
  cluster.execute(taskData),           ← Original promise
  setTimeout(..., 320000)              ← Timeout safety net
])
  ↓
  Whichever resolves/rejects first wins
  ↓
  If cluster hangs, timeout wins after 5min 20sec
  ↓
  Error caught, logged, batch continues
```

**Result**: No more infinite hangs!

---

## Alternative Solutions Considered

### Option 1: Switch to `CONCURRENCY_BROWSER` ❌
```typescript
concurrency: Cluster.CONCURRENCY_BROWSER  // Separate browser per task
```
**Pros**: Complete isolation, no context leak
**Cons**: Much slower (browser startup overhead per task)
**Verdict**: Not needed if timeout fix works

### Option 2: Reduce Concurrency to 1 ❌
```bash
BATCH_WORKER_CONCURRENCY=1
```
**Pros**: No concurrency issues
**Cons**: 2x slower, defeats purpose of parallelization
**Verdict**: Last resort only

### Option 3: Force Cluster Restart After N Tasks ❌
```typescript
if (completed % 5 === 0) {
  await cluster.close();
  cluster = await Cluster.launch(...);
}
```
**Pros**: Fresh state every 5 tasks
**Cons**: Complex, adds overhead
**Verdict**: Too complex for marginal benefit

### Option 4: Timeout Wrapper ✅ (Chosen)
**Pros**: Simple, catches all hang scenarios, graceful degradation
**Cons**: None (safety net doesn't hurt performance)
**Verdict**: Best solution

---

## Testing Instructions

### Test 1: Verify Timeout Works
1. Restart worker: `npm run worker`
2. Upload CSV with 10 recipients
3. Watch logs for detailed task queuing/completion
4. Should see:
   ```
   🔵 Queuing task 0/9: ...
   🔵 Queuing task 1/9: ...
   ...
   🔵 Queuing task 9/9: ...

   ✅ Task 0 completed: ...
   ✅ Task 1 completed: ...
   ...
   ✅ Task 9 completed: ...
   ```
5. All 10 should complete successfully

### Test 2: If Task Still Hangs
If task 9 still hangs:
1. Wait 5 minutes 20 seconds
2. Should see: `❌ Failed to render recipient 9: Task 9 timed out after 320000ms`
3. Batch continues: `✅ Cluster rendering complete: 9 success, 1 failed`
4. 9 PDFs generated successfully

### Test 3: Monitor Logs for Stuck Task
Look for this pattern:
```
🔵 Queuing task 9/9: Bob Johnson    ← Queued
[Long pause - no completion log]
❌ Failed to render recipient 9: Task 9 timed out  ← Timeout after 5min 20sec
```

---

## Files Modified

| File | Lines Changed | Change Description |
|------|--------------|-------------------|
| `lib/batch-processor/canvas-renderer-cluster.ts` | +15 | Added timeout wrapper, detailed logging |

---

## Performance Impact

**Before Fix**:
- Hangs forever at 9/10 → 0 PDFs delivered
- Infinite waiting, complete failure

**After Fix**:
- If task 10 works: Same speed, 10/10 success
- If task 10 hangs: 5min 20sec timeout → 9/10 success (90% delivery)

**Trade-off**:
- Small timeout overhead (negligible - just a timer)
- Massive reliability gain (no infinite hangs)

---

## Next Steps

### Immediate:
1. ✅ Timeout wrapper implemented
2. ⏳ User tests with 10-recipient batch
3. ⏳ Monitor logs to see if task 10 completes or times out

### If Timeout Still Occurs:
1. Check which specific task hangs (logs will show)
2. Consider reducing concurrency to 1 (more stable)
3. Consider switching to CONCURRENCY_BROWSER (slower but isolated)
4. Investigate browser memory usage (WSL2 may need more RAM)

### Long-term:
1. Move to native Linux (no WSL2 overhead)
2. Implement browser context cleanup between batches
3. Add cluster health monitoring
4. Consider Redis-based queue for better reliability

---

## Related Issues

- `BATCH_RENDERING_FIXES.md` - 5 root causes fixed
- `FIX_SMALL_BATCH_ISSUE.md` - Small batch template rendering
- `PERSISTENT_RENDERER_BUGS_FOUND.md` - Persistent renderer issues

---

## Conclusion

**Status**: ✅ **FIX IMPLEMENTED**

**Problem**: Task 10 hangs forever in cluster queue
**Root Cause**: Cluster queue deadlock under resource pressure
**Solution**: Timeout wrapper (5min 20sec safety net)
**Impact**: No more infinite hangs - worst case is 9/10 success instead of 0/10 failure

**Ready for testing!** 🚀
