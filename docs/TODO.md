# Project TODO Items

This document tracks all TODO items found throughout the codebase. Each item includes context, current status, and future implementation plans.

## Table of Contents

- [Leave Quota Utils](#leave-quota-utils)
- [Leave Request Actions](#leave-request-actions)
- [Dashboard Performance](#dashboard-performance)

---

## Leave Quota Utils

### 1. Refactor Tenure Accrual Rules to be Configurable by Admin

**File:** `apps/leave-requests/lib/leave-quota-utils.ts:49`

**Current Status:** Hardcoded constants in code
```typescript
const TENURE_ACCRUAL_RULES = {
  1: 12,  // Onboarding year (prorated)
  2: 13,  // 2nd year (completed 1 full year)
  3: 15,  // 3rd year (completed 2 full years)
  4: 18,  // 4th year (completed 3 full years)
  5: 22   // 5+ year (completed 4+ full years)
} as const;
```

**Future Plan:** Store in database table and cache for performance


---

### 2. Refactor Leave Balance Calculation for Better Performance

**File:** `apps/leave-requests/lib/leave-quota-utils.ts:325`

**Current Status:** Query all leave requests for user in year and calculate on-demand

**Issues Identified:**
- Does not include CARRY OVER RULES to the next year
- Multiple queries to Supabase that could be consolidated
- Data already fetched in parent components but not reused

**Future Plan:** Optimize calculation logic and implement caching strategies

---

## Leave Request Actions

### 3. Refactor Email Sending to Background Job (New Leave Request)

**File:** `apps/leave-requests/app/dashboard/leave/new/actions.ts:185`

**Current Status:** Synchronous email sending in the main request flow

**Future Plan:** Move to background job for better performance and reliability

**Benefits:**
- Can retry if failed
- Can get leave request data from database instead of form data
- Better performance (non-blocking)
- Can queue multiple notifications

**Impact:** Currently blocks the main request flow until emails are sent, potentially causing timeouts.

---

## Dashboard Performance

### 4. Dashboard Performance Optimization

**File:** `apps/leave-requests/app/dashboard/page.tsx:13`


**Techniques Implemented:**
1. **Parallel Data Fetching (Promise.all):** Only 2 queries needed instead of sequential
2. **React Suspense with Progressive Loading:** Fast content shows immediately, heavy components load separately with skeletons
3. **Optimized Queries:** Limited to last 10 requests, efficient joins

Continue to refactor the dashboard if needed
Link ref: https://blog.logrocket.com/fix-nextjs-app-slow-performance/