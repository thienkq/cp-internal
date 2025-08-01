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

### Database Schema

```sql
-- Users table includes:
ALTER TABLE public.users ADD COLUMN tenure_anniversary_date DATE;

-- Extended absences table:
CREATE TABLE public.extended_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Automatic Calculation Logic

The system automatically updates `tenure_anniversary_date` whenever extended absences are modified through database triggers. **Only completed absences affect tenure immediately** - future absences are processed when they end via a scheduled job.

```sql
-- Function calculates total days of COMPLETED extended absences (> 30 days)
-- and pushes the tenure_anniversary_date forward by that amount
CREATE OR REPLACE FUNCTION public.update_tenure_anniversary_date()
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id UUID := COALESCE(NEW.user_id, OLD.user_id);
    v_user_start_date DATE;
    total_absence_days INTEGER;
    new_tenure_anniversary_date DATE;
BEGIN
    -- Get the user's original start date
    SELECT start_date
      INTO v_user_start_date
      FROM public.users
     WHERE id = v_user_id;

    IF v_user_start_date IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calculate total duration of COMPLETED extended absences (> 30 days)
    -- Only count absences that have ended (end_date <= CURRENT_DATE)
    SELECT COALESCE(SUM(end_date - start_date + 1), 0)
    INTO total_absence_days
    FROM public.extended_absences
    WHERE user_id = v_user_id 
      AND (end_date - start_date + 1) > 30
      AND end_date <= CURRENT_DATE;

    -- Adjust tenure anniversary date
    new_tenure_anniversary_date := v_user_start_date + total_absence_days;
    
    -- Update user record
    UPDATE public.users
    SET tenure_anniversary_date = new_tenure_anniversary_date
    WHERE id = v_user_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to call the function on extended_absences changes
CREATE TRIGGER handle_extended_absence_change
    AFTER INSERT OR UPDATE OR DELETE ON public.extended_absences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tenure_anniversary_date();
```

### Scheduled Processing for Future Absences

A daily cron job processes extended absences that have just completed:

```sql
-- Function to process newly completed extended absences
CREATE OR REPLACE FUNCTION public.process_completed_extended_absences()
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    absence_record RECORD;
BEGIN
    -- Find all extended absences that ended yesterday
    FOR absence_record IN
        SELECT DISTINCT user_id
        FROM public.extended_absences
        WHERE end_date = CURRENT_DATE - INTERVAL '1 day'
          AND (end_date - start_date + 1) > 30
    LOOP
        -- Trigger the update function for each affected user
        PERFORM public.update_tenure_anniversary_date_for_user(absence_record.user_id);
    END LOOP;
END;
$$;

-- Helper function to update specific user's tenure
CREATE OR REPLACE FUNCTION public.update_tenure_anniversary_date_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_user_start_date DATE;
    total_absence_days INTEGER;
    new_tenure_anniversary_date DATE;
BEGIN
    -- Get the user's original start date
    SELECT start_date
      INTO v_user_start_date
      FROM public.users
     WHERE id = p_user_id;

    IF v_user_start_date IS NULL THEN
        RETURN;
    END IF;

    -- Calculate total duration of COMPLETED extended absences (> 30 days)
    SELECT COALESCE(SUM(end_date - start_date + 1), 0)
    INTO total_absence_days
    FROM public.extended_absences
    WHERE user_id = p_user_id 
      AND (end_date - start_date + 1) > 30
      AND end_date <= CURRENT_DATE;

    -- Adjust tenure anniversary date
    new_tenure_anniversary_date := v_user_start_date + total_absence_days;
    
    -- Update user record
    UPDATE public.users
    SET tenure_anniversary_date = new_tenure_anniversary_date
    WHERE id = p_user_id;
END;
$$;
```

### Cron Job Setup

Set up a daily cron job to process completed absences:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * psql -d your_database -c "SELECT public.process_completed_extended_absences();"
```

Or using a task scheduler in your application:

```typescript
// Daily job to process completed extended absences
export async function processCompletedExtendedAbsences() {
  try {
    await db.query('SELECT public.process_completed_extended_absences()');
    console.log('Processed completed extended absences');
  } catch (error) {
    console.error('Error processing completed absences:', error);
  }
}

// Schedule to run daily at 2 AM
schedule.scheduleJob('0 2 * * *', processCompletedExtendedAbsences);
```

### Monitoring and Testing

#### Monitoring the Cron Job

```sql
-- Check for absences that should have been processed
SELECT 
    u.full_name,
    ea.start_date,
    ea.end_date,
    (ea.end_date - ea.start_date + 1) as absence_days,
    u.tenure_anniversary_date
FROM public.extended_absences ea
JOIN public.users u ON ea.user_id = u.id
WHERE ea.end_date <= CURRENT_DATE 
  AND (ea.end_date - ea.start_date + 1) > 30
  AND ea.end_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ea.end_date DESC;
```

#### Testing the Cron Job

```typescript
// Manual test function
export async function testProcessCompletedAbsences() {
  const beforeCount = await db.query(`
    SELECT COUNT(*) FROM public.extended_absences 
    WHERE end_date <= CURRENT_DATE AND (end_date - start_date + 1) > 30
  `);
  
  await processCompletedExtendedAbsences();
  
  const afterCount = await db.query(`
    SELECT COUNT(*) FROM public.extended_absences 
    WHERE end_date <= CURRENT_DATE AND (end_date - start_date + 1) > 30
  `);
  
  console.log(`Processed ${beforeCount - afterCount} completed absences`);
}
```

#### Logging and Alerts

```typescript
// Enhanced cron job with logging
export async function processCompletedExtendedAbsences() {
  const startTime = new Date();
  
  try {
    const result = await db.query('SELECT public.process_completed_extended_absences()');
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`✅ Processed completed absences in ${duration}ms`);
    
    // Send alert if processing took too long
    if (duration > 5000) {
      await sendAlert('Extended absence processing took longer than expected');
    }
    
  } catch (error) {
    console.error('❌ Error processing completed absences:', error);
    await sendAlert('Failed to process completed extended absences');
  }
}
```

## Examples

### Example 1: Employee with No Extended Absences

**Scenario:**
- Employee joins: January 1, 2020
- No extended absences
- Current date: January 1, 2024

**Database Values:**
start_date: 2020-01-01
tenure_anniversary_date: 2020-01-01

**Tenure Calculation:**
```javascript
const tenureYears = calculateYearsBetween('2020-01-01', '2024-01-01');
// Result: 4 years
```

**Anniversary Date:** January 1st every year
**Leave Accrual:** 18 days (4th year)

### Example 2: Employee with Extended Absence

**Scenario:**
- Employee joins: January 1, 2020
- Extended absence: February 1, 2022 to May 1, 2022 (90 days)
- Current date: January 1, 2024

**Database Values:**
start_date: 2020-01-01 // Original hire date (never changes)
tenure_anniversary_date: 2020-04-01 // Adjusted by 90 days

**Tenure Calculation:**
```javascript
const tenureYears = calculateYearsBetween('2020-04-01', '2024-01-01');
// Result: 3 years, 9 months
```

**Anniversary Date:** April 1st every year
**Leave Accrual:** 15 days (3rd year)

### Example 3: Multiple Extended Absences

**Scenario:**
- Employee joins: January 1, 2019
- Extended absence 1: March 1, 2020 to May 1, 2020 (61 days)
- Extended absence 2: June 1, 2022 to August 15, 2022 (75 days)
- Current date: January 1, 2024

**Database Values:**
start_date: 2019-01-01
tenure_anniversary_date: 2019-05-17 // Adjusted by 61 + 75 = 136 days

**Tenure Calculation:**
```javascript
const tenureYears = calculateYearsBetween('2019-05-17', '2024-01-01');
// Result: 4 years, 7 months
```

**Anniversary Date:** May 17th every year
**Leave Accrual:** 18 days (4th year)

### Example 4: Future Extended Absence

**Scenario:**
- Employee joins: January 1, 2020
- Current date: January 1, 2024
- Future extended absence: March 1, 2024 to June 1, 2024 (92 days) - **PLANNED**

**Database Values:**
start_date: 2020-01-01
tenure_anniversary_date: 2020-01-01 // **NOT affected by future absence yet**

**Tenure Calculation (Before Absence):**
```javascript
const tenureYears = calculateYearsBetween('2020-01-01', '2024-01-01');
// Result: 4 years
```

**Leave Accrual:** 18 days (4th year)

**After Absence Completes (July 1, 2024):**
- Cron job processes the completed absence
- tenure_anniversary_date updated to: 2020-04-02 // Adjusted by 92 days

**Tenure Calculation (After Absence):**
```javascript
const tenureYears = calculateYearsBetween('2020-04-02', '2024-07-01');
// Result: 4 years, 3 months
```

**Leave Accrual:** Still 18 days (4th year) - no change in leave tier

## Application Usage

### 1. Calculating Current Tenure

```typescript
// Get user's tenure information
const anniversaryInfo = await getAnniversaryInfo(user.tenure_anniversary_date);

console.log(`${user.full_name} has ${anniversaryInfo.years} years of service`);
// Output: "John Doe has 4 years of service"
```

### 2. Checking if Today is an Anniversary

```typescript
// Check if today is the user's work anniversary
const isAnniversary = await isWorkAnniversaryToday(user.tenure_anniversary_date);

if (isAnniversary) {
  const message = getAnniversaryMessage(user.full_name, anniversaryInfo.years);
  // Output: "Happy 4th Work Anniversary, John Doe! 🎉"
}
```

### 3. Getting Upcoming Anniversaries

```typescript
// Get upcoming anniversaries for admin dashboard
const upcomingAnniversaries = await getUpcomingAnniversaries(10);

upcomingAnniversaries.forEach(anniversary => {
  console.log(`${anniversary.full_name}: ${anniversary.years} years on ${anniversary.anniversary_date}`);
});
```

### 4. Leave Accrual Calculation

```typescript
// Calculate leave accrual based on tenure
function calculateLeaveAccrual(tenureYears: number): number {
  if (tenureYears >= 5) return 22;
  if (tenureYears >= 4) return 18;
  if (tenureYears >= 3) return 15;
  if (tenureYears >= 2) return 13;
  return 12;
}

const { years } = await calculateEffectiveTenure(user.tenure_anniversary_date);
const leaveAccrual = calculateLeaveAccrual(years);
```


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
5. **Future Absence Completes**: Processed by daily cron job when `end_date <= CURRENT_DATE`

### Edge Cases Handled

1. **Multiple Overlapping Absences**: Each absence is calculated independently
2. **Absences Shorter than 30 Days**: Ignored (don't affect tenure)
3. **Future Absences**: Only count when they've completed (processed by cron job)
4. **Partial Month Calculations**: Use precise date arithmetic
5. **Absences Ending on Weekends**: Cron job processes them the next business day

### Migration Strategy

1. **Add Column**: `tenure_anniversary_date` to existing `users` table
2. **Create Functions**: Database functions for automatic calculation
3. **Add Triggers**: Automatic updates when extended absences change
4. **Backfill Data**: Calculate initial values for existing users

This approach ensures that tenure calculations are both accurate and performant, while maintaining data integrity through database-level automation.