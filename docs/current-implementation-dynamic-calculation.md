# Current Implementation: Dynamic Tenure Calculation

## Overview

This document explains how the Leave Request System **currently implements** tenure calculation using a **dynamic calculation approach**. Unlike the pre-calculated system, this approach calculates effective tenure on every request by querying extended absences and computing overlaps in real-time.

## How It Works

### 1. **Real-Time Calculation**
Every time tenure is needed, the system:
- Queries the database for extended absences
- Calculates overlaps with the service period
- Applies business rules (30-day threshold)
- Computes effective tenure on the fly

### 2. **No Pre-Calculated Fields**
- No `tenure_anniversary_date` field in the database
- No database triggers or cron jobs
- No data synchronization concerns
- Original absence records remain unchanged

## Code Implementation

### Core Function: `calculateEffectiveTenure`

```typescript
export async function calculateEffectiveTenure(
  startDate: string,
  userId: string,
  targetDate: Date = new Date()
): Promise<{ years: number; months: number; days: number }> {
  const supabase = await createServerClient();
  
  // Get all extended absences that have ended by the target date
  const { data: absences } = await supabase
    .from("extended_absences")
    .select("*")
    .eq("user_id", userId)
    .lte("end_date", targetDate.toISOString().split('T')[0]);

  let totalAbsenceDays = 0;

  if (absences) {
    for (const absence of absences) {
      const absenceStart = new Date(absence.start_date);
      const absenceEnd = new Date(absence.end_date);
      
      // Calculate overlap between absence and service period
      const serviceStart = new Date(startDate);
      const serviceEnd = targetDate;
      
      // Find actual overlap period
      const overlapStart = new Date(Math.max(absenceStart.getTime(), serviceStart.getTime()));
      const overlapEnd = new Date(Math.min(absenceEnd.getTime(), serviceEnd.getTime()));
      
      // Only count if there's actually an overlap
      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Only absences longer than 30 days affect tenure
        if (overlapDays > 30) {
          totalAbsenceDays += overlapDays;
        }
      }
    }
  }

  // Calculate total service days
  const employmentStart = new Date(startDate);
  const totalDays = Math.ceil((targetDate.getTime() - employmentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Effective service days = total days - absence days
  const effectiveDays = Math.max(0, totalDays - totalAbsenceDays);
  
  // Convert to years, months, days
  const years = Math.floor(effectiveDays / 365);
  const remainingDays = effectiveDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  return { years, months, days };
}
```

### Helper Function: `shouldProcessAbsenceForTenure`

```typescript
export function shouldProcessAbsenceForTenure(
  absence: ExtendedAbsence,
  currentDate: Date = new Date()
): boolean {
  const absenceStart = new Date(absence.start_date);
  const absenceEnd = new Date(absence.end_date);
  const current = currentDate;
  
  // Only process absences that have ended
  if (absenceEnd > current) {
    return false;
  }
  
  // Calculate absence duration in days
  const durationDays = Math.ceil((absenceEnd.getTime() - absenceStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Only absences longer than 30 days affect tenure
  return durationDays > 30;
}
```

## Business Rules Implementation

### ✅ **30-Day Threshold**
- Only absences longer than 30 consecutive days affect tenure
- Shorter absences are ignored completely
- This matches company policy requirements

### ✅ **Completed Absences Only**
- Only processes absences where `end_date <= current_date`
- Future absences don't affect tenure until they complete
- No need for `processed_at` tracking

### ✅ **Overlap Calculation**
- Correctly handles partial overlaps between absence and service period
- Uses precise date arithmetic for accurate calculations
- Accounts for edge cases (start date, end date boundaries)

### ✅ **Immediate Updates**
- Changes to absences are reflected immediately in tenure calculations
- No delay or synchronization issues
- Real-time accuracy guaranteed

## UI Components

### 1. **Enhanced Extended Absence List**
Shows each absence with:
- **Duration**: Exact number of days
- **Tenure Impact**: How many days added to tenure
- **Status**: Future, Affects Tenure, or No Impact
- **Visual Indicators**: Color-coded badges and icons

### 2. **Real-Time Form Preview**
When creating/editing absences:
- **Duration Preview**: Shows exact days before saving
- **Tenure Impact Warning**: Clear indication of tenure effect
- **Business Rule Validation**: Ensures 30-day threshold compliance

### 3. **Tenure Dashboard**
Displays:
- **Effective Tenure**: Years, months, days for each employee
- **Leave Tier**: Automatic calculation based on tenure
- **Next Anniversary**: Countdown to work anniversary
- **Filtering & Search**: Easy employee management

## Advantages

### 🚀 **Performance Benefits**
- **Simple Queries**: Single table query per calculation
- **No Complex Joins**: Direct absence data access
- **Efficient Processing**: Streamlined overlap calculations

### 🛠️ **Maintenance Benefits**
- **No Database Triggers**: Simpler database schema
- **No Cron Jobs**: No scheduled task management
- **No Sync Issues**: Data always consistent
- **Easy Debugging**: Clear, linear code flow

### 📊 **Accuracy Benefits**
- **Real-Time**: Always reflects current state
- **No Lag**: Immediate updates when absences change
- **Audit Trail**: Original records preserved
- **Verifiable**: Easy to manually verify calculations

## Disadvantages

### ⚠️ **Performance Considerations**
- **Database Queries**: One query per tenure calculation
- **Repeated Calculations**: Overlap logic runs every time
- **Scalability**: Performance may degrade with many users/absences

### 🔄 **Resource Usage**
- **CPU**: Date calculations on every request
- **Database**: Multiple queries for dashboard views
- **Memory**: Temporary data processing

## When This Approach Works Best

### ✅ **Perfect For:**
- **Small to Medium Organizations** (up to 100 employees)
- **Development & Testing** environments
- **Real-time Accuracy** requirements
- **Simple Use Cases** without heavy reporting

### 🔄 **Consider Alternatives When:**
- Organization grows beyond 100+ employees
- Dashboard performance becomes an issue
- Absence management becomes very frequent
- Heavy usage of tenure-based analytics

## Example Scenarios

### **Scenario 1: Employee with No Absences**
```
Start Date: 2020-01-01
Current Date: 2024-01-01
Extended Absences: None
Result: 4 years, 0 months, 0 days
```

### **Scenario 2: Employee with Extended Absence**
```
Start Date: 2020-01-01
Extended Absence: 2022-02-01 to 2022-05-01 (90 days)
Current Date: 2024-01-01
Result: 3 years, 9 months, 0 days
Calculation: 4 years - 90 days = 3.25 years
```

### **Scenario 3: Employee with Short Absence**
```
Start Date: 2020-01-01
Short Absence: 2022-06-01 to 2022-06-25 (25 days)
Current Date: 2024-01-01
Result: 4 years, 0 months, 0 days
Note: 25 days < 30, so no tenure impact
```

