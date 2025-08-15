# Tenure Calculation Logic with Extended Absences

## Overview

This document explains how the Leave Request System calculates employee tenure (years of service) while accounting for extended absences. The system uses a **pre-calculated approach** to ensure accurate and efficient tenure calculations for leave accrual and anniversary tracking.

## Problem Statement

### Why We Need Accurate Tenure Calculation

1. **Leave Accrual**: Annual leave quotas increase based on years of service
   - 1st year: 12 days
   - 2nd year: 13 days  
   - 3rd year: 15 days
   - 4th year: 18 days
   - 5th year and beyond: 22 days

2. **Extended Absences Must Be Excluded**: Any unpaid leave longer than 30 consecutive days should not count toward tenure

## Solution: Pre-calculated `tenure_anniversary_date`

Instead of calculating tenure dynamically each time, we store an adjusted anniversary date that accounts for all extended absences.

### Core Concept

The system automatically updates `tenure_anniversary_date` whenever extended absences are modified. **Only completed absences affect tenure immediately** - future absences are processed when they end via a scheduled job.

### Key Fields

- **`start_date`**: Original hire date (never changes)
- **`tenure_anniversary_date`**: Adjusted anniversary date accounting for extended absences
- **`processed_at`**: Timestamp tracking when an absence was processed for tenure calculation

### Processing Logic

#### 1. Immediate Processing (When Absence is Created/Modified)
- **Completed Absences** (`end_date <= current_date`): Process immediately and mark as processed
- **Future Absences** (`end_date > current_date`): Leave unprocessed for future cron job processing

#### 2. Scheduled Processing (Daily Cron Job)
- Only processes absences where `processed_at IS NULL`
- Processes ALL absences that have ended (`end_date <= current_date`)
- Sets `processed_at` timestamp after processing
- **Recovery-Safe**: Catches missed absences from cron job failures

#### 3. Modification Handling (Delete + Create Only)
- **No Direct Editing**: Extended absences cannot be modified - only deleted and recreated
- **Delete Processing**: 
  - If already processed: Recalculate tenure (remove absence days)
  - If not processed: Simply delete (no tenure impact)
- **Create Processing**: Process new absence normally based on completion status

### Processing States

1. **✅ Processed**: Absence has been accounted for in tenure calculation
2. **⏳ Pending Processing**: Absence has ended but not yet processed
3. **📅 Future Absence**: Absence hasn't ended yet

## Examples

### Example 1: Employee with No Extended Absences

**Scenario:**
- Employee joins: January 1, 2020
- No extended absences
- Current date: January 1, 2024

**Values:**
- `start_date`: 2020-01-01
- `tenure_anniversary_date`: 2020-01-01

**Tenure Calculation:**
- Result: 4 years
- Anniversary Date: January 1st every year
- Leave Accrual: 18 days (4th year)

### Example 2: Employee with Extended Absence

**Scenario:**
- Employee joins: January 1, 2020
- Extended absence: February 1, 2022 to May 1, 2022 (90 days)
- Current date: January 1, 2024

**Values:**
- `start_date`: 2020-01-01 (never changes)
- `tenure_anniversary_date`: 2020-04-01 (adjusted by 90 days)

**Tenure Calculation:**
- Result: 3 years, 9 months
- Anniversary Date: April 1st every year
- Leave Accrual: 15 days (3rd year)

### Example 3: Multiple Extended Absences

**Scenario:**
- Employee joins: January 1, 2019
- Extended absence 1: March 1, 2020 to May 1, 2020 (61 days)
- Extended absence 2: June 1, 2022 to August 15, 2022 (75 days)
- Current date: January 1, 2024

**Values:**
- `start_date`: 2019-01-01
- `tenure_anniversary_date`: 2019-05-17 (adjusted by 61 + 75 = 136 days)

**Tenure Calculation:**
- Result: 4 years, 7 months
- Anniversary Date: May 17th every year
- Leave Accrual: 18 days (4th year)

### Example 4: Future Extended Absence

**Scenario:**
- Employee joins: January 1, 2020
- Current date: January 1, 2024
- Future extended absence: March 1, 2024 to June 1, 2024 (92 days) - **PLANNED**

**Values:**
- `start_date`: 2020-01-01
- `tenure_anniversary_date`: 2020-01-01 (**NOT affected by future absence yet**)

**Before Absence:**
- Tenure: 4 years
- Leave Accrual: 18 days (4th year)

**After Absence Completes (July 1, 2024):**
- Cron job processes the completed absence
- `tenure_anniversary_date` updated to: 2020-04-02 (adjusted by 92 days)
- Tenure: 4 years, 3 months
- Leave Accrual: Still 18 days (4th year) - no change in leave tier

### Example 5: Deleting and Recreating Extended Absence

**Scenario:**
- Employee joins: January 1, 2020
- Extended absence: March 1, 2022 to June 1, 2022 (92 days) - **COMPLETED & PROCESSED**
- Current date: January 1, 2024
- Admin needs to change absence: March 1, 2022 to July 1, 2022 (122 days) - **30 days longer**

**Process:**
1. **Delete Original Absence** (92 days, already processed):
   - Remove 92 days from tenure calculation
   - `tenure_anniversary_date` recalculated: 2020-01-01 (back to original)
   - Tenure: 4 years (increased from 3 years, 9 months)

2. **Create New Absence** (122 days, completed):
   - Process immediately (end_date <= current_date)
   - Add 122 days to tenure calculation
   - `tenure_anniversary_date` updated: 2020-05-02 (adjusted by 122 days)
   - Tenure: 3 years, 8 months
   - Leave Accrual: 15 days (3rd year)

**Result:**
- Clean, auditable change history
- No complex modification logic needed
- Tenure calculation remains accurate

### Example 6: Deleting Unprocessed Absence

**Scenario:**
- Employee joins: January 1, 2020
- Extended absence: March 1, 2024 to June 1, 2024 (92 days) - **FUTURE, NOT PROCESSED**
- Current date: January 1, 2024
- Admin deletes the absence

**Result:**
- No tenure impact (absence wasn't processed yet)
- Simple deletion with no recalculation needed
- `tenure_anniversary_date` remains: 2020-01-01

## Benefits of This Approach

### 1. Performance
- **Fast**: Simple date arithmetic instead of complex database queries
- **Scalable**: No need to process extended absences on every calculation
- **Efficient**: Single database field lookup vs. multiple table joins

### 2. Accuracy
- **Automatic**: Database triggers ensure `tenure_anniversary_date` is always up-to-date
- **Consistent**: All tenure calculations use the same base date
- **Reliable**: Extended absences are accounted for immediately when recorded

### 3. Simplicity
- **Clear Logic**: Application code only needs to handle simple date calculations
- **Maintainable**: Complex business logic is encapsulated in database functions
- **Debuggable**: Easy to verify tenure calculations manually

## Implementation Notes

### When `tenure_anniversary_date` is Updated

1. **New User Creation**: Set to same value as `start_date`
2. **Extended Absence Added**: Only affects tenure if the absence has already ended
3. **Extended Absence Modified**: Only affects tenure if the absence has already ended
4. **Extended Absence Deleted**: Automatically recalculated via trigger
5. **Future Absence Completes**: Processed by daily cron job when `end_date <= current_date`

### Edge Cases Handled

1. **Multiple Overlapping Absences**: Each absence is calculated independently
2. **Absences Shorter than 30 Days**: Ignored (don't affect tenure)
3. **Future Absences**: Only count when they've completed (processed by cron job)
4. **Partial Month Calculations**: Use precise date arithmetic
5. **Absences Ending on Weekends**: Cron job processes them the next business day
6. **Double-Processing Prevention**: `processed_at` timestamp prevents recalculation
7. **System Downtime**: Cron job processes missed absences on next run
8. **Manual Corrections**: Absences can be corrected by deleting and recreating
9. **Modification Handling**: No direct editing - only delete + create operations
10. **Clean History**: All changes are auditable through delete/create operations

### Migration Strategy

1. **Add Column**: `tenure_anniversary_date` to existing `users` table
2. **Add Processed Column**: `processed_at` to existing `extended_absences` table
3. **Create Functions**: Database functions for automatic calculation
4. **Add Triggers**: Automatic updates when extended absences change
5. **Backfill Data**: Calculate initial values for existing users
6. **Mark Existing Absences**: Set `processed_at` for all completed absences

## Summary

The system implements a robust solution to prevent double-calculation of extended absences:

### ✅ **Key Features**

1. **`processed_at` Column**: Tracks when each absence was processed for tenure calculation
2. **Immediate Processing**: Only processes completed absences and marks them as processed
3. **Cron Job Processing**: Only processes unprocessed absences (`processed_at IS NULL`)
4. **Double-Processing Prevention**: Each absence can only be processed once
5. **Modification Handling**: Smart recalculation based on significance of changes

### ✅ **Processing Flow**

```
Absence Created/Modified
         ↓
Is end_date <= current_date?
         ↓
    YES → Process immediately → Set processed_at = NOW
    NO  → Leave processed_at = NULL → Wait for cron job
```

```
Daily Cron Job
         ↓
Find absences where:
- end_date <= current_date
- processed_at IS NULL
- duration > 30 days
         ↓
Process each user's tenure → Set processed_at = NOW
```

### ✅ **Benefits**

- **No Double-Calculation**: Each absence processed exactly once
- **Audit Trail**: Know when each absence was processed
- **Recovery**: Can handle system downtime gracefully
- **Monitoring**: Easy to verify processing status
- **Flexible**: Can reprocess if needed for corrections

This ensures that whether an absence is created as completed or as a future absence, it will only affect tenure calculations once and at the right time!
