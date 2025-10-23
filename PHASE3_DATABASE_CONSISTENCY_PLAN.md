# Phase 3: Database & Query Consistency - Implementation Plan

**Created**: October 24, 2025
**Status**: 📋 PLANNING
**Risk Level**: LOW - Additive changes only, no breaking modifications
**Estimated Duration**: 3-4 hours

---

## Analysis Summary

### Current State

**Database Files Analyzed**: 15 files (excluding tests)
- `tracking-queries.ts` - Campaign and recipient tracking (38 functions)
- `call-tracking-queries.ts` - ElevenLabs call tracking (13 functions)
- `batch-job-queries.ts` - Batch job management (21 functions)
- `retail-queries.ts` - Retail store operations (23 functions)
- `campaign-management.ts` - Campaign CRUD (14 functions)
- `template-queries.ts` - Template management (16 functions)
- `asset-management.ts` - File uploads and assets (10 functions)
- `retail-analytics.ts` - Analytics calculations (8 functions)
- `performance-matrix-queries.ts` - Performance metrics (4 functions)
- `campaign-landing-page-queries.ts` - Landing page config (6 functions)
- `canvas-queries.ts` - Canvas template storage (3 functions)
- `connection.ts` - Database singleton (3 functions)
- `init-batch-tables.ts` - Table initialization (1 function)

### Quantitative Analysis

| Metric | Count | Coverage |
|--------|-------|----------|
| **Total exported functions** | 160 | 100% |
| **Functions with try-catch** | ~73 | 46% |
| **Console.log statements** | 214 | Scattered |
| **Explicit error throws** | 14 | 9% |
| **Null return patterns** | 302 | Consistent |
| **SQL injection fixes** | 8 | ✅ Already fixed (Phase 1) |

### Key Findings

#### ✅ **Good Patterns (Keep These)**

1. **Consistent null returns**: Functions return `null` for "not found" cases
   ```typescript
   export function getCampaignById(id: string): Campaign | null {
     const stmt = db.prepare("SELECT * FROM campaigns WHERE id = ?");
     return stmt.get(id) as Campaign | null;
   }
   ```

2. **Parameterized queries**: All SQL uses prepared statements (SQL injection safe)

3. **Type safety**: Strong TypeScript types for all database models

4. **Upsert patterns**: Proper ON CONFLICT handling for duplicates

#### ⚠️ **Inconsistencies (Fix These)**

1. **Inconsistent error handling**:
   - Some functions have try-catch, others don't
   - Error messages vary in detail
   - No structured error types

2. **Scattered logging**:
   - 214 console.log statements
   - No consistent format
   - Missing context in many logs
   - Hard to trace operations

3. **Missing input validation**:
   - Some functions don't validate required parameters
   - No consistent validation approach

4. **Variable error responses**:
   - Some throw errors, some return null
   - Inconsistent error data structure

---

## Implementation Strategy

### Guiding Principles

1. **Additive Only**: No breaking changes to existing functions
2. **Backward Compatible**: Maintain all current return types
3. **Low Risk**: Add utilities, don't rewrite core logic
4. **Incremental**: Can be deployed in parts
5. **Measurable**: Clear success criteria

### Scope Decisions

#### ✅ **In Scope for Phase 3**

1. Create database logging utility
2. Add structured logging to critical operations
3. Document error handling patterns
4. Add input validation helpers
5. Improve error messages where low-risk

#### ❌ **Out of Scope for Phase 3**

1. Rewriting all database functions (too risky)
2. Changing return types (breaking change)
3. Adding ORM layer (architectural change)
4. Database migration system (separate phase)
5. Performance optimization (separate phase)

---

## Part 1: Database Logging Utility

### Goal
Create centralized, structured logging for all database operations

### Implementation

**File**: `lib/database/logger.ts`

```typescript
/**
 * Structured database operation logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DatabaseLogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  table?: string;
  recordId?: string;
  duration?: number;
  error?: string;
  context?: Record<string, any>;
}

class DatabaseLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production' ||
                   process.env.DATABASE_LOGGING === 'true';
  }

  private log(entry: DatabaseLogEntry): void {
    if (!this.enabled) return;

    const prefix = `[DB ${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.operation}`;
    const details = {
      table: entry.table,
      id: entry.recordId,
      duration: entry.duration ? `${entry.duration}ms` : undefined,
      ...entry.context,
    };

    switch (entry.level) {
      case 'error':
        console.error(message, details, entry.error);
        break;
      case 'warn':
        console.warn(message, details);
        break;
      case 'debug':
        console.log(message, details);
        break;
      default:
        console.log(message, details);
    }
  }

  debug(operation: string, context?: Record<string, any>): void {
    this.log({ timestamp: new Date().toISOString(), level: 'debug', operation, context });
  }

  info(operation: string, table?: string, recordId?: string, context?: Record<string, any>): void {
    this.log({ timestamp: new Date().toISOString(), level: 'info', operation, table, recordId, context });
  }

  warn(operation: string, message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      operation,
      context: { ...context, warning: message }
    });
  }

  error(operation: string, error: Error | string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      operation,
      error: error instanceof Error ? error.message : error,
      context: {
        ...context,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  /**
   * Measure operation duration
   */
  time(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.log({
        timestamp: new Date().toISOString(),
        level: 'debug',
        operation,
        duration,
      });
    };
  }
}

export const dbLogger = new DatabaseLogger();
```

**Benefits**:
- ✅ Structured, consistent format
- ✅ Toggleable (production-safe)
- ✅ Performance timing
- ✅ Context-rich logging
- ✅ Error stack traces

---

## Part 2: Input Validation Helpers

### Goal
Consistent parameter validation across database functions

### Implementation

**File**: `lib/database/validators.ts`

```typescript
/**
 * Database input validation helpers
 */

import { dbLogger } from './logger';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(
  value: any,
  fieldName: string,
  operation: string
): void {
  if (value === null || value === undefined || value === '') {
    const error = new ValidationError(
      `${fieldName} is required`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName });
    throw error;
  }
}

export function validateString(
  value: any,
  fieldName: string,
  operation: string,
  options?: { minLength?: number; maxLength?: number }
): void {
  validateRequired(value, fieldName, operation);

  if (typeof value !== 'string') {
    const error = new ValidationError(
      `${fieldName} must be a string`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }

  if (options?.minLength && value.length < options.minLength) {
    const error = new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }

  if (options?.maxLength && value.length > options.maxLength) {
    const error = new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }
}

export function validateId(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateString(value, fieldName, operation, { minLength: 1 });
}

export function validateEmail(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateString(value, fieldName, operation);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    const error = new ValidationError(
      `${fieldName} must be a valid email`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName });
    throw error;
  }
}

export function validateNumber(
  value: any,
  fieldName: string,
  operation: string,
  options?: { min?: number; max?: number; integer?: boolean }
): void {
  validateRequired(value, fieldName, operation);

  const num = Number(value);
  if (isNaN(num)) {
    const error = new ValidationError(
      `${fieldName} must be a number`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }

  if (options?.integer && !Number.isInteger(num)) {
    const error = new ValidationError(
      `${fieldName} must be an integer`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }

  if (options?.min !== undefined && num < options.min) {
    const error = new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }

  if (options?.max !== undefined && num > options.max) {
    const error = new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }
}
```

**Benefits**:
- ✅ Consistent validation logic
- ✅ Clear error messages
- ✅ Automatic logging on validation failure
- ✅ Reusable across all database functions

---

## Part 3: Apply to Critical Functions

### Goal
Add logging and validation to high-impact database functions

### Priority Functions (Top 20 by usage)

1. **Tracking Queries**:
   - `createCampaign()` - Add validation
   - `createRecipient()` - Add validation
   - `trackEvent()` - Add logging
   - `trackConversion()` - Add logging

2. **Call Tracking**:
   - `upsertElevenLabsCall()` - Add validation + logging
   - `getCampaignCallMetrics()` - Add logging

3. **Batch Jobs**:
   - `createBatchJob()` - Add validation
   - `updateBatchJobStatus()` - Add logging

4. **Retail**:
   - `createRetailStore()` - Add validation
   - `getRetailStores()` - Add logging (already has SQL injection fix)

### Example Migration

**Before** (`tracking-queries.ts`):
```typescript
export function createCampaign(data: {
  name: string;
  message: string;
  companyName: string;
}): Campaign {
  const db = getDatabase();
  const id = nanoid(16);
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO campaigns (id, name, message, company_name, created_at, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  stmt.run(id, data.name, data.message, data.companyName, created_at);

  return {
    id,
    name: data.name,
    message: data.message,
    company_name: data.companyName,
    created_at,
    status: "active",
  };
}
```

**After** (with logging + validation):
```typescript
import { dbLogger } from './logger';
import { validateRequired, validateString } from './validators';

export function createCampaign(data: {
  name: string;
  message: string;
  companyName: string;
}): Campaign {
  const operation = 'createCampaign';

  // Validate inputs
  validateString(data.name, 'name', operation, { minLength: 1, maxLength: 255 });
  validateString(data.message, 'message', operation, { minLength: 1 });
  validateString(data.companyName, 'companyName', operation, { minLength: 1, maxLength: 255 });

  const db = getDatabase();
  const id = nanoid(16);
  const created_at = new Date().toISOString();

  dbLogger.info(operation, 'campaigns', id, { name: data.name });

  const stmt = db.prepare(`
    INSERT INTO campaigns (id, name, message, company_name, created_at, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  try {
    stmt.run(id, data.name, data.message, data.companyName, created_at);
    dbLogger.debug(`${operation} completed`, { id, name: data.name });
  } catch (error) {
    dbLogger.error(operation, error as Error, { id, name: data.name });
    throw error;
  }

  return {
    id,
    name: data.name,
    message: data.message,
    company_name: data.companyName,
    created_at,
    status: "active",
  };
}
```

**Changes**:
- ✅ Added input validation (3 lines)
- ✅ Added info log (1 line)
- ✅ Added try-catch with error log (5 lines)
- ✅ Added debug log on success (1 line)
- ✅ **Total**: +10 lines, no breaking changes

---

## Part 4: Documentation

### Goal
Document error handling patterns for developers

### Create `DATABASE_PATTERNS.md`

Document:
1. Error handling patterns (null vs throw)
2. Validation guidelines
3. Logging best practices
4. Common pitfalls
5. Migration examples

---

## Implementation Plan

### Step 1: Create Utilities (30 min)
- [ ] Create `lib/database/logger.ts`
- [ ] Create `lib/database/validators.ts`
- [ ] Add tests for validators
- [ ] Commit: "feat: Add database logging and validation utilities"

### Step 2: Migrate Critical Functions (90 min)
- [ ] Part A: Tracking queries (5 functions) - 30 min
  - `createCampaign()`
  - `createRecipient()`
  - `trackEvent()`
  - `trackConversion()`
  - `getCampaignById()`
- [ ] Part B: Call tracking (3 functions) - 20 min
  - `upsertElevenLabsCall()`
  - `getCampaignCallMetrics()`
  - `getAllCallMetrics()`
- [ ] Part C: Batch jobs (3 functions) - 20 min
  - `createBatchJob()`
  - `updateBatchJobStatus()`
  - `getBatchJobById()`
- [ ] Part D: Retail (2 functions) - 20 min
  - `createRetailStore()`
  - `updateRetailStore()`
- [ ] Commit per part

### Step 3: Testing (30 min)
- [ ] Run TypeScript compiler
- [ ] Test all migrated functions
- [ ] Verify logs in development
- [ ] Check for regressions

### Step 4: Documentation (30 min)
- [ ] Create `DATABASE_PATTERNS.md`
- [ ] Update `CONSISTENCY_FIXES_PLAN.md`
- [ ] Add migration guide for remaining functions
- [ ] Final commit

---

## Success Criteria

- ✅ Logger utility created and working
- ✅ Validator helpers available and tested
- ✅ 15-20 critical functions migrated
- ✅ No breaking changes
- ✅ TypeScript compilation passes
- ✅ All tests pass
- ✅ Structured logging visible in development
- ✅ Documentation complete

---

## Rollback Plan

If issues arise:
1. Each commit is independent and can be reverted
2. New utilities don't affect existing code
3. Can pause migration at any point
4. No database schema changes

---

## Future Phases (Out of Scope)

- **Phase 4**: Migrate remaining 140 functions
- **Phase 5**: Add database query performance monitoring
- **Phase 6**: Implement query result caching
- **Phase 7**: Add database migration system
