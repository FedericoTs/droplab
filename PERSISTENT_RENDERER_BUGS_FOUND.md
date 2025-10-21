# Persistent Renderer - Bugs Found & Status

## 🐛 **Critical Bugs Discovered**

### Bug #1: Worker Initialization Hangs Forever
**Symptom**: Only "Worker 3/4 ready" shown, then hangs

**Root Cause**: `Promise.all()` in `initialize()` waits for ALL workers. If one fails/hangs, entire pool stuck.

**Code:**
```typescript
this.workers = await Promise.all(workerPromises);  // ← Hangs if one worker fails!
```

**Fix Needed**: Add timeout wrapper:
```typescript
const initWithTimeout = (promise, timeout) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Worker init timeout')), timeout))
  ]);

this.workers = await Promise.all(
  workerPromises.map(p => initWithTimeout(p, 60000))  // 60s timeout per worker
);
```

---

### Bug #2: Failed Renders Return Empty Strings
**Symptom**: PDFs generated but don't match template (using fallback layout)

**Root Cause**: When rendering fails, code sets empty string:
```typescript
} catch (error) {
  failed++;
  results.set(globalIndex, '');  // ← WRONG! PDF generator sees empty URL
}
```

**Impact**: PDF generator receives empty `creativeImageUrl`, falls back to basic layout (no template image)

**Fix Needed**: Throw error instead:
```typescript
} catch (error) {
  failed++;
  console.error(`❌ Failed to render recipient ${globalIndex}:`, error);
  throw error;  // ← Fail the job instead of silently continuing
}
```

---

### Bug #3: Progress Not Updating
**Symptom**: Batch-jobs dashboard shows no progress

**Root Cause**: Progress callback called but database updates may be batched/delayed

**Fix Needed**: Force immediate database flush or check polling interval

---

### Bug #4: No Fallback Timeout
**Symptom**: Orchestrator waits forever for persistent renderer

**Root Cause**: No timeout on `renderBatchTemplatesPersistent()` call

**Fix Needed**: Add timeout wrapper:
```typescript
const renderWithTimeout = (timeout) =>
  Promise.race([
    renderBatchTemplatesPersistent(...),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Rendering timeout')), timeout)
    )
  ]);

try {
  renderedImages = await renderWithTimeout(300000);  // 5min timeout
} catch (error) {
  console.warn('⚠️  Persistent rendering failed/timeout, falling back');
  renderedImages = await renderBatchTemplatesCluster(...);
}
```

---

## ✅ **Status**

- ❌ **Persistent rendering: DISABLED** (too many bugs)
- ✅ **Cluster rendering: ACTIVE** (stable, proven)
- ⏳ **Fixes: In progress**

## 🔧 **Next Steps**

1. ✅ User restarts worker with cluster mode (stable)
2. ⏳ Fix all 4 bugs in persistent renderer
3. ⏳ Test fixes with small batch (5 recipients)
4. ⏳ Re-enable when proven stable

## 📋 **User Action Required**

**Restart worker to use stable cluster mode:**
```bash
# Stop current worker (Ctrl+C)
npm run worker
```

**Verify cluster mode active:**
```
🔄 Using CLUSTER renderer (default)  ← Should see this
```

**Test batch processing:**
- Upload CSV with 5-10 recipients
- Verify PDFs match template perfectly
- Check progress updates in dashboard
