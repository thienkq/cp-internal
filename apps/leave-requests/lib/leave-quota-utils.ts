import { createServerClient } from "@workspace/supabase";
import { 
  calculateEffectiveTenure, 
  shouldProcessAbsenceForTenure,
  ExtendedAbsence 
} from "./anniversary-utils";
import { calculateWorkingDays } from "./utils";

/**
 * Leave Quota Calculation Utilities
 * 
 * This module handles leave entitlement calculations by reusing core logic
 * from anniversary-utils.ts to ensure consistency:
 * 
 * - calculateEffectiveTenure: Core tenure calculation with absence deductions
 * - shouldProcessAbsenceForTenure: 30-day threshold and completion logic
 * - ExtendedAbsence: Shared type definitions
 * 
 * This ensures both anniversary and leave calculations follow the same
 * business rules for extended absences and tenure calculations.
 */

// Types
export interface LeaveEntitlement {
  originalStartDate: string | null;
  effectiveStartDate: string | null;
  workingAnniversary: string | null;
  employmentYear: number;
  effectiveEmploymentYear: number;
  isOnboardingYear: boolean;
  totalQuota: number;
  proratedQuota?: number;
  extendedAbsenceImpact: {
    totalAbsenceDays: number;
    anniversaryDelay: number;
    tenureReduction: string;
  };
}

export interface LeaveBalance {
  totalQuota: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
  availableDays: number;
  employmentYear: number;
  isOnboardingYear: boolean;
}

// TODO: Refactor tenure accrual rules to be configurable by admin
// Current: Hardcoded constants in code
// Future: Store in database table and cache for performance
// Constants (temporary - will be replaced by database lookup)
const TENURE_ACCRUAL_RULES = {
  1: 12,  // Onboarding year (prorated)
  2: 13,  // 2nd year (completed 1 full year)
  3: 15,  // 3rd year (completed 2 full years)
  4: 18,  // 4th year (completed 3 full years)
  5: 22   // 5th+ year (completed 4+ full years)
} as const;

// Helper Functions
function yearOfEmployment(startDate: string, untilTime: Date = new Date()): number {
  const start = new Date(startDate);
  const until = new Date(untilTime);
  
  // Calculate the difference in years and round up
  const yearsDiff = (until.getFullYear() - start.getFullYear()) + 
                   (until.getMonth() - start.getMonth()) / 12 + 
                   (until.getDate() - start.getDate()) / 365;
  
  return Math.ceil(yearsDiff);
}

function totalAnnualLeaveDays(employmentYear: number): number {
  // Employment year represents which year of employment the employee is in
  // Year 1 = onboarding year (prorated), Year 2 = completed 1 full year, etc.
  if (employmentYear >= 5) {
    return TENURE_ACCRUAL_RULES[5];  // 22 days for 5+ years
  }
  return TENURE_ACCRUAL_RULES[employmentYear as keyof typeof TENURE_ACCRUAL_RULES] || TENURE_ACCRUAL_RULES[1];
}

function isOnboardingYear(employmentYear: number): boolean {
  return employmentYear === 1;
}

function numberOfLeaveDaysInOnboardingYear(startDate: string): number {
  const start = new Date(startDate);
  const startMonth = start.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Formula: 12 - startMonth + 1
  return 12 - startMonth + 1;
}

function calculateWorkingAnniversary(
  originalStartDate: string,
  effectiveTenure: { years: number; months: number; days: number }
): string {
  const start = new Date(originalStartDate);
  const now = new Date();
  
  // Calculate actual days since start
  const actualDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate effective days worked
  const effectiveDays = effectiveTenure.years * 365 + effectiveTenure.months * 30 + effectiveTenure.days;
  
  // The difference is the total absence days that affected tenure
  const totalAbsenceDays = Math.max(0, actualDays - effectiveDays);
  
  // Working anniversary is original anniversary + absence days
  const workingAnniversary = new Date(start);
  workingAnniversary.setFullYear(start.getFullYear() + 1);
  workingAnniversary.setDate(workingAnniversary.getDate() + totalAbsenceDays);
  
  return workingAnniversary.toISOString().split('T')[0]!;
}

function calculateEffectiveStartDate(
  originalStartDate: string,
  effectiveTenure: { years: number; months: number; days: number }
): string {
  const original = new Date(originalStartDate);
  const now = new Date();
  
  // Calculate actual days since start
  const actualDays = Math.floor((now.getTime() - original.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate effective days worked (from anniversary utils logic)
  const effectiveDays = effectiveTenure.years * 365 + effectiveTenure.months * 30 + effectiveTenure.days;
  
  // Total absence days that affected tenure
  const absenceDays = Math.max(0, actualDays - effectiveDays);
  
  // Effective start date = original start + absence days
  const effectiveStart = new Date(original);
  effectiveStart.setDate(effectiveStart.getDate() + absenceDays);
  
  return effectiveStart.toISOString().split('T')[0]!;
}

function calculateProratedOnboardingYearQuota(
  effectiveStartDate: string,
  targetDate: Date
): number {
  const effectiveStart = new Date(effectiveStartDate);
  const target = new Date(targetDate);
  
  // Use the effective start month for proration
  const effectiveStartMonth = effectiveStart.getMonth() + 1;
  
  // If we're still in the same calendar year
  if (effectiveStart.getFullYear() === target.getFullYear()) {
    return Math.max(1, 12 - effectiveStartMonth + 1);
  }
  
  // If we've crossed into the next year, check if still in first effective year
  const effectiveMonthsWorked = (target.getFullYear() - effectiveStart.getFullYear()) * 12 + 
                               (target.getMonth() - effectiveStart.getMonth());
  
  if (effectiveMonthsWorked < 12) {
    // Still in onboarding year, calculate remaining months
    return Math.max(1, 12 - effectiveStartMonth + 1);
  }
  
  // Completed onboarding year, move to regular calculation
  return totalAnnualLeaveDays(2); // Second year quota
}

async function calculateAbsenceImpact(
  userId: string,
  originalStartDate: string,
  targetDate: Date
): Promise<{
  totalAbsenceDays: number;
  anniversaryDelay: number;
  tenureReduction: string;
}> {
  const supabase = await createServerClient();
  
  // Get all extended absences (reuse same query pattern as anniversary utils)
  const { data: absences } = await supabase
    .from("extended_absences")
    .select("*")
    .eq("user_id", userId)
    .lte("end_date", targetDate.toISOString().split('T')[0]);
  
  let totalAbsenceDays = 0;
  
  if (absences) {
    for (const absence of absences) {
      // Reuse the business logic from anniversary utils
      if (!shouldProcessAbsenceForTenure(absence as ExtendedAbsence, targetDate)) {
        continue;
      }
      
      const absenceStart = new Date(absence.start_date);
      const absenceEnd = new Date(absence.end_date);
      const serviceStart = new Date(originalStartDate);
      
      // Calculate overlap with service period (same logic as anniversary utils)
      const overlapStart = new Date(Math.max(absenceStart.getTime(), serviceStart.getTime()));
      const overlapEnd = new Date(Math.min(absenceEnd.getTime(), targetDate.getTime()));
      
      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Note: shouldProcessAbsenceForTenure already ensured > 30 days
        totalAbsenceDays += overlapDays;
      }
    }
  }
  
  const anniversaryDelay = totalAbsenceDays;
  const tenureReduction = formatDuration(totalAbsenceDays);
  
  return {
    totalAbsenceDays,
    anniversaryDelay,
    tenureReduction
  };
}

function formatDuration(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;
  
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
  
  return parts.join(', ') || '0 days';
}

function calculateLeaveDays(startDate: string, endDate: string, isHalfDay: boolean): number {
  return calculateWorkingDays(startDate, endDate, isHalfDay);
}

// Main Functions
export async function calculateCompleteLeaveEntitlement(
  userId: string,
  targetDate: Date = new Date()
): Promise<LeaveEntitlement> {
  const supabase = await createServerClient();
  
  // Get user details
  const { data: user } = await supabase
    .from("users")
    .select("start_date")
    .eq("id", userId)
    .single();
  
  if (!user?.start_date) {
    // If no start date is set, default to 12 days (onboarding year quota)
    return {
      originalStartDate: null,
      effectiveStartDate: null,
      workingAnniversary: null,
      employmentYear: 1,
      effectiveEmploymentYear: 1,
      isOnboardingYear: true,
      totalQuota: 12,
      proratedQuota: 12,
      extendedAbsenceImpact: {
        totalAbsenceDays: 0,
        anniversaryDelay: 0,
        tenureReduction: '0 days'
      }
    };
  }
  
  const originalStartDate = user.start_date;
  
  // Step 1: Calculate effective tenure (considering extended absences)
  const effectiveTenure = await calculateEffectiveTenure(
    originalStartDate,
    userId,
    targetDate
  );
  
  // Step 2: Calculate working anniversary (adjusted for absences)
  const workingAnniversary = calculateWorkingAnniversary(
    originalStartDate,
    effectiveTenure
  );
  
  // Step 3: Determine employment years (original vs effective)
  const originalEmploymentYear = yearOfEmployment(originalStartDate, targetDate);
  const effectiveEmploymentYear = Math.max(1, effectiveTenure.years + 1);
  
  // Step 4: Check if still in onboarding year (considering absences)
  const isOnboarding = isOnboardingYear(effectiveEmploymentYear);
  
  // Step 5: Calculate base quota
  let totalQuota: number;
  let proratedQuota: number | undefined;
  
  if (isOnboarding) {
    // Onboarding year: Use prorated calculation based on EFFECTIVE start
    const effectiveStartDate = calculateEffectiveStartDate(originalStartDate, effectiveTenure);
    proratedQuota = calculateProratedOnboardingYearQuota(effectiveStartDate, targetDate);
    totalQuota = proratedQuota;
  } else {
    // Regular year: Use tenure-based quota
    totalQuota = totalAnnualLeaveDays(effectiveEmploymentYear);
  }
  
  // Step 6: Calculate absence impact summary
  const absenceImpact = await calculateAbsenceImpact(userId, originalStartDate, targetDate);
  
  return {
    originalStartDate,
    effectiveStartDate: calculateEffectiveStartDate(originalStartDate, effectiveTenure),
    workingAnniversary,
    employmentYear: originalEmploymentYear,
    effectiveEmploymentYear,
    isOnboardingYear: isOnboarding,
    totalQuota,
    proratedQuota,
    extendedAbsenceImpact: absenceImpact
  };
}

// TODO: Refactor leave balance calculation for better performance
// Current approach: Query all leave requests for user in year and calculate on-demand
// 
// Performance issues:
// - Queries all leave requests every time
// - Recalculates working days for each request
// - No caching mechanism
//
// Better approaches:
// 1. Pre-calculated balance table:
//    - Store monthly/yearly balances in separate table
//    - Update incrementally when requests are approved/rejected
//    - Query single row instead of all requests
//
// 2. Materialized view:
//    - Database-level aggregation
//    - Refresh on leave request changes
//    - Fast queries with pre-computed sums
//
export async function calculateLeaveBalance(
  userId: string,
  leaveYear: number = new Date().getFullYear()
): Promise<LeaveBalance> {
  const supabase = await createServerClient();
  
  // Get leave entitlement - use current date for current year, end of year for future years
  const currentYear = new Date().getFullYear();
  const targetDate = leaveYear === currentYear ? new Date() : new Date(`${leaveYear}-12-31`);
  const entitlement = await calculateCompleteLeaveEntitlement(userId, targetDate);
  
  // Get leave requests for the year - only include paid leave types
  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      status, 
      start_date, 
      end_date, 
      is_half_day,
      leave_types!inner(is_paid)
    `)
    .eq("user_id", userId)
    .eq("leave_types.is_paid", true)
    .gte("start_date", `${leaveYear}-01-01`)
    .lte("start_date", `${leaveYear}-12-31`);
  
  let usedDays = 0;
  let pendingDays = 0;
  
  if (leaveRequests) {
    for (const request of leaveRequests) {
      // Only paid leave types are returned from the query, so all requests count against quota
      const days = calculateLeaveDays(request.start_date, request.end_date, request.is_half_day);
      
      if (request.status === "approved") {
        usedDays += days;
      } else if (request.status === "pending") {
        pendingDays += days;
      }
      // Note: rejected and canceled requests don't count
      // Note: Unpaid leave is already filtered out in the query
    }
  }
  
  const remainingDays = entitlement.totalQuota - usedDays - pendingDays;
  const availableDays = remainingDays; // Same as remaining since both approved and pending are subtracted
  
  return {
    totalQuota: entitlement.totalQuota,
    usedDays,
    remainingDays,
    pendingDays,
    availableDays,
    employmentYear: entitlement.effectiveEmploymentYear,
    isOnboardingYear: entitlement.isOnboardingYear
  };
}

// Simple quota calculation for backwards compatibility
export function getLeaveQuotaByTenure(years: number): number {
  if (years < 1) return 12;  // Onboarding year (less than 1 full year)
  if (years >= 1 && years < 2) return 13;  // Completed 1 full year
  if (years >= 2 && years < 3) return 15;  // Completed 2 full years
  if (years >= 3 && years < 4) return 18;  // Completed 3 full years
  return 22;  // Completed 4+ full years
}