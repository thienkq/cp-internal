import { createServerClient } from "@workspace/supabase";

export interface ExtendedAbsence {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnniversaryInfo {
  years: number;
  months: number;
  days: number;
  isToday: boolean;
  nextAnniversary: Date;
  daysUntilNext: number;
}

/**
 * Check if an extended absence should be processed for tenure calculation
 * Follows the documented business rules:
 * - Only absences longer than 30 days affect tenure
 * - Only completed absences (end_date <= current_date) are processed
 * - Future absences are not processed until they complete
 */
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

/**
 * Calculate effective tenure by deducting extended absences
 * Extended absence = any period longer than 30 consecutive days
 * 
 * This function implements the same logic as the pre-calculated approach:
 * - Only processes absences that have ended (end_date <= current_date)
 * - Only counts absences longer than 30 days
 * - Handles overlap calculations correctly
 * - Follows the same business rules as the documented system
 */
export async function calculateEffectiveTenure(
  startDate: string,
  userId: string,
  targetDate: Date = new Date()
): Promise<{ years: number; months: number; days: number }> {
  const supabase = await createServerClient();
  
  // Get all extended absences for the user that have ended by the target date
  // This matches the documented logic: only process completed absences
  const { data: absences } = await supabase
    .from("extended_absences")
    .select("*")
    .eq("user_id", userId)
    .lte("end_date", targetDate.toISOString().split('T')[0]);

  let totalAbsenceDays = 0;

  if (absences) {
    for (const absence of absences) {
      // Use helper function to determine if absence should be processed
      if (!shouldProcessAbsenceForTenure(absence, targetDate)) {
        continue;
      }
      
      const absenceStart = new Date(absence.start_date);
      const absenceEnd = new Date(absence.end_date);
      
      // Calculate the overlap between absence and service period
      const serviceStart = new Date(startDate);
      const serviceEnd = targetDate;
      
      // Find the actual overlap period 
      const overlapStart = new Date(Math.max(absenceStart.getTime(), serviceStart.getTime()));
      const overlapEnd = new Date(Math.min(absenceEnd.getTime(), serviceEnd.getTime()));
      
      // Only count if there's actually an overlap
      if (overlapStart <= overlapEnd) {
        // Calculate overlap duration in days
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Add to total (helper function already ensured > 30 days)
        totalAbsenceDays += overlapDays;
      }
    }
  }

  // Calculate total service days
  const employmentStart = new Date(startDate);
  const totalDays = Math.ceil((targetDate.getTime() - employmentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Effective service days = total days - absence days
  const effectiveDays = Math.max(0, totalDays - totalAbsenceDays);
  
  // Convert to years, months, days (same calculation as documented approach)
  const years = Math.floor(effectiveDays / 365);
  const remainingDays = effectiveDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  return { years, months, days };
}

/**
 * Check if today is the user's work anniversary
 */
export async function isWorkAnniversaryToday(
  startDate: string,
  userId: string
): Promise<boolean> {
  if (!startDate) return false;
  
  const today = new Date();
  const start = new Date(startDate);
  
  // Check if month and day match
  const isSameMonth = today.getMonth() === start.getMonth();
  const isSameDay = today.getDate() === start.getDate();
  
  if (!isSameMonth || !isSameDay) return false;
  
  // Calculate effective tenure to ensure it's a real anniversary
  const { years } = await calculateEffectiveTenure(startDate, userId, today);
  return years > 0;
}

/**
 * Get anniversary information for a user
 */
export async function getAnniversaryInfo(
  startDate: string,
  userId: string,
  targetDate: Date = new Date()
): Promise<AnniversaryInfo | null> {
  if (!startDate) return null;
  
  const { years, months, days } = await calculateEffectiveTenure(startDate, userId, targetDate);
  const start = new Date(startDate);
  
  // Calculate next anniversary date
  const nextAnniversary = new Date(targetDate.getFullYear(), start.getMonth(), start.getDate());
  
  // If this year's anniversary has passed, calculate next year's
  if (nextAnniversary < targetDate) {
    nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
  }
  
  const daysUntilNext = Math.ceil((nextAnniversary.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const isToday = targetDate.getMonth() === start.getMonth() && targetDate.getDate() === start.getDate();
  
  return {
    years,
    months,
    days,
    isToday,
    nextAnniversary,
    daysUntilNext
  };
}

/**
 * Get upcoming anniversaries for admin dashboard
 */
export async function getUpcomingAnniversaries(limit: number = 10): Promise<Array<{
  user_id: string;
  full_name: string;
  start_date: string;
  anniversary_date: Date;
  years: number;
  days_until: number;
}>> {
  const supabase = await createServerClient();
  
  // Get all users with start dates
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, start_date")
    .not("start_date", "is", null)
    .eq("is_active", true);
  
  if (!users) return [];
  
  const today = new Date();
  const upcomingAnniversaries = [];
  
  for (const user of users) {
    const anniversaryInfo = await getAnniversaryInfo(user.start_date, user.id, today);
    
    if (anniversaryInfo && anniversaryInfo.daysUntilNext <= 365) {
      upcomingAnniversaries.push({
        user_id: user.id,
        full_name: user.full_name,
        start_date: user.start_date,
        anniversary_date: anniversaryInfo.nextAnniversary,
        years: anniversaryInfo.years + 1, // Next anniversary year
        days_until: anniversaryInfo.daysUntilNext
      });
    }
  }
  
  // Sort by days until anniversary and limit results
  return upcomingAnniversaries
    .sort((a, b) => a.days_until - b.days_until)
    .slice(0, limit);
}

/**
 * Get anniversaries for the current month only
 * Only includes users with at least 1 year of effective service
 */
export async function getThisMonthAnniversaries(): Promise<Array<{
  user_id: string;
  full_name: string;
  start_date: string;
  anniversary_date: Date;
  years: number;
  days_until: number;
}>> {
  const supabase = await createServerClient();
  
  // Get all users with start dates
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, start_date")
    .not("start_date", "is", null)
    .eq("is_active", true);
  
  if (!users) return [];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const thisMonthAnniversaries = [];
  
  for (const user of users) {
    const start = new Date(user.start_date);
    const anniversaryThisYear = new Date(currentYear, start.getMonth(), start.getDate());
    
    // Check if anniversary is in current month
    if (anniversaryThisYear.getMonth() === currentMonth) {
      const daysUntil = Math.ceil((anniversaryThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Include all anniversaries in the current month (including passed ones)
      if (true) { // Show all anniversaries in current month
        // Calculate effective tenure to ensure it's a real anniversary
        const { years: effectiveYears } = await calculateEffectiveTenure(user.start_date, user.id, anniversaryThisYear);
        
        // Only include if user has at least 1 year of effective service
        if (effectiveYears >= 1) {
          thisMonthAnniversaries.push({
            user_id: user.id,
            full_name: user.full_name,
            start_date: user.start_date,
            anniversary_date: anniversaryThisYear,
            years: effectiveYears,
            days_until: daysUntil
          });
        }
      }
    }
  }
  
  // Sort by day of month
  return thisMonthAnniversaries.sort((a, b) => a.anniversary_date.getDate() - b.anniversary_date.getDate());
}

/**
 * Get anniversary message based on years
 */
export function getAnniversaryMessage(fullName: string, years: number): string {
  if (years === 1) {
    return `Happy 1st Work Anniversary, ${fullName}! 🎉`;
  } else if (years === 2) {
    return `Happy 2nd Work Anniversary, ${fullName}! 🎊`;
  } else if (years === 3) {
    return `Happy 3rd Work Anniversary, ${fullName}! 🏆`;
  } else if (years === 5) {
    return `Happy 5th Work Anniversary, ${fullName}! 🎖️`;
  } else if (years === 10) {
    return `Happy 10th Work Anniversary, ${fullName}! 💎`;
  } else {
    return `Happy ${years}${getOrdinalSuffix(years)} Work Anniversary, ${fullName}! 🎉`;
  }
}

/**
 * Get ordinal suffix for numbers
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
} 