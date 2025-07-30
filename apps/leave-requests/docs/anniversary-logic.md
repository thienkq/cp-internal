# Work Anniversary Logic Documentation

## Overview

The work anniversary feature calculates effective tenure by deducting extended absences from the total service time, then detects when a user's anniversary occurs.

## Key Logic

### 1. Anniversary Detection
- **Start Date**: User's employment start date (e.g., 30/7/2024)
- **Anniversary**: Same month/day in subsequent years (e.g., 30/7/2025, 30/7/2026)
- **Minimum Requirement**: Must be at least 1 year of effective service

### 2. Effective Tenure Calculation
- **Total Service**: Days from start date to target date
- **Extended Absences**: Periods >30 consecutive days (deducted from service)
- **Effective Service**: Total days - absence days
- **Result**: Years, months, days of effective service

### 3. Anniversary Rules
✅ **IS Anniversary**:
- Same month and day as start date
- At least 1 year of effective service
- Examples: 30/7/2025, 30/7/2026, 30/7/2027

❌ **NOT Anniversary**:
- Different month or day
- Less than 1 year of service
- Examples: 31/7/2025, 29/7/2025, 30/7/2024

## Examples

### Example 1: No Extended Absences
```
Start Date: 30/7/2024
Target Date: 30/7/2025
Result: ✅ 1st Anniversary (1 year, 0 months, 0 days)
```

### Example 2: With Extended Absence
```
Start Date: 30/7/2024
Extended Absence: 1/1/2025 - 1/3/2025 (60 days)
Target Date: 30/7/2025
Effective Service: 365 - 60 = 305 days
Result: ❌ No Anniversary (0 years, 10 months, 5 days)
```

### Example 3: Multiple Extended Absences
```
Start Date: 30/7/2024
Absence 1: 1/1/2025 - 1/2/2025 (32 days)
Absence 2: 1/4/2025 - 1/5/2025 (31 days)
Target Date: 30/7/2025
Effective Service: 365 - 63 = 302 days
Result: ❌ No Anniversary (0 years, 9 months, 27 days)
```

## Testing

### Run Simple Test
```bash
node test-anniversary.js
```

### Run TypeScript Test
```bash
npx tsx lib/anniversary-utils.test.ts
```

### Manual Testing
1. Set user's start date in database
2. Add extended absences (if testing absence logic)
3. Check dashboard on anniversary date
4. Verify admin dashboard shows upcoming anniversaries

## Database Schema

### Users Table
```sql
start_date date -- Employment start date
```

### Extended Absences Table
```sql
user_id uuid REFERENCES users(id)
start_date date -- Absence start
end_date date -- Absence end
reason text -- Optional reason
```

## Implementation Files

- `lib/anniversary-utils.ts` - Core calculation logic
- `components/work-anniversary-celebration.tsx` - Celebration modal
- `components/work-anniversary-banner.tsx` - Dashboard banner
- `components/anniversary-wrapper.tsx` - Modal wrapper
- `components/admin/upcoming-anniversaries.tsx` - Admin dashboard widget

## Edge Cases Handled

1. **Leap Years**: Properly handles February 29th in leap years
2. **Invalid Dates**: Gracefully handles null/undefined start dates
3. **Short Absences**: Only counts absences >30 days
4. **Multiple Absences**: Sums all qualifying absences
5. **Future Dates**: Handles calculations for future dates
6. **Same Day**: No anniversary on start date itself

## Configuration

The system uses these default values:
- **Extended Absence Threshold**: 30 consecutive days
- **Anniversary Detection**: Same month/day, minimum 1 year
- **Message Templates**: Customized for 1st, 2nd, 3rd, 5th, 10th, and other years 