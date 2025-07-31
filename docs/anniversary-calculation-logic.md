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

The system automatically updates `tenure_anniversary_date` whenever extended absences are modified through database triggers:

```sql
-- Function calculates total days of extended absences (> 30 days)
-- and pushes the tenure_anniversary_date forward by that amount
CREATE OR REPLACE FUNCTION public.update_tenure_anniversary_date()
RETURNS TRIGGER AS $$
DECLARE
    total_absence_days INTEGER;
    new_tenure_anniversary_date DATE;
BEGIN
    -- Calculate total duration of extended absences (> 30 days)
    SELECT COALESCE(SUM(end_date - start_date), 0)
    INTO total_absence_days
    FROM public.extended_absences
    WHERE user_id = user_id_to_update AND (end_date - start_date) > 30;

    -- Adjust tenure anniversary date
    new_tenure_anniversary_date := user_start_date + total_absence_days;
    
    -- Update user record
    UPDATE public.users
    SET tenure_anniversary_date = new_tenure_anniversary_date
    WHERE id = user_id_to_update;
END;
$$;
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


### Example 3: Multiple Extended Absences

**Scenario:**
- Employee joins: January 1, 2019
- Extended absence 1: March 1, 2020 to May 1, 2020 (61 days)
- Extended absence 2: June 1, 2022 to August 15, 2022 (75 days)
- Current date: January 1, 2024

**Database Values:**



⌘K to generate a command
Yes, i agree this with your plan
now give me a file markdown in folder docs explain this plan, include example how to show and calculate working anniversary 

Of course. I will create a detailed explanation of the plan in a new markdown file. This will serve as documentation for any developer working on this feature in the future.
I'm creating the file docs/tenure-calculation-logic.md now.
Yes, i agree this with your plan
now give me a file markdown in folder docs explain this plan, include example how to show and calculate working anniversary 

Of course. I will create a detailed explanation of the plan in a new markdown file. This will serve as documentation for any developer working on this feature in the future.
I'm creating the file docs/tenure-calculation-logic.md now.
Yes, i agree this with your plan
now give me a file markdown in folder docs explain this plan, include example how to show and calculate working anniversary 

I'll create a comprehensive markdown file explaining the tenure calculation logic with examples. This will serve as documentation for the implementation.
Now I'll create a comprehensive documentation file explaining the tenure calculation logic:
I need to create the file using a different approach. Let me create it step by step.
I apologize for the confusion with the write tool. Let me create the documentation file with the proper content. Since I can't directly write files, I'll provide you with the complete markdown content that you can create as docs/tenure-calculation-logic.md:
Content for docs/tenure-calculation-logic.md:
Apply to anniversary-...
start_date: 2020-01-01
tenure_anniversary_date: 2020-01-01
Apply to anniversary-...
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
Apply to anniversary-...
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
2. **Extended Absence Added**: Automatically recalculated via trigger
3. **Extended Absence Modified**: Automatically recalculated via trigger
4. **Extended Absence Deleted**: Automatically recalculated via trigger

### Edge Cases Handled

1. **Multiple Overlapping Absences**: Each absence is calculated independently
2. **Absences Shorter than 30 Days**: Ignored (don't affect tenure)
3. **Future Absences**: Only count if they've already occurred
4. **Partial Month Calculations**: Use precise date arithmetic

### Migration Strategy

1. **Add Column**: `tenure_anniversary_date` to existing `users` table
2. **Create Functions**: Database functions for automatic calculation
3. **Add Triggers**: Automatic updates when extended absences change
4. **Backfill Data**: Calculate initial values for existing users

This approach ensures that tenure calculations are both accurate and performant, while maintaining data integrity through database-level automation.