import { type User } from "@workspace/supabase"

/**
 * Get user initials from email or name
 * Prioritizes user's name over email for better UX
 * @param user - Supabase user object
 * @returns string - User initials (e.g., "JD" for "John Doe")
 */
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return "U"

  // Try to get initials from user's name first (Google login)
  if (user.user_metadata?.full_name) {
    return getInitialsFromName(user.user_metadata.full_name)
  }

  // Try to get initials from user's name (if available)
  if (user.user_metadata?.name) {
    return getInitialsFromName(user.user_metadata.name)
  }

  // Fallback to email initials
  if (user.email) {
    return getInitialsFromEmail(user.email)
  }

  return "U"
}

/**
 * Extract initials from a full name
 * @param name - Full name (e.g., "John Doe")
 * @returns string - Initials (e.g., "JD")
 */
function getInitialsFromName(name: string): string {
  const nameParts = name.trim().split(/\s+/)
  
  if (nameParts.length === 1) {
    // Single name, take first 2 characters
    return nameParts[0]?.substring(0, 2).toUpperCase() || "U"
  }
  
  // Multiple names, take first letter of each
  const initials = nameParts
    .slice(0, 2) // Take first 2 names max
    .map(part => part.charAt(0).toUpperCase())
    .join('')
  
  return initials || "U"
}

/**
 * Extract initials from email address
 * @param email - Email address (e.g., "john.doe@example.com")
 * @returns string - Initials (e.g., "JD")
 */
function getInitialsFromEmail(email: string): string {
  const username = email.split('@')[0]
  
  if (!username) return "U"
  
  // Handle email formats like "john.doe" or "john_doe"
  const nameParts = username.split(/[._-]/)
  
  if (nameParts.length === 1) {
    // Single part, take first 2 characters
    return username.substring(0, 2).toUpperCase()
  }
  
  // Multiple parts, take first letter of each
  const initials = nameParts
    .slice(0, 2) // Take first 2 parts max
    .map(part => part.charAt(0).toUpperCase())
    .join('')
  
  return initials || "U"
}

/**
 * Get user display name (name or email fallback)
 * @param user - Supabase user object
 * @returns string - Display name
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "User"

  // Try to get full name first
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }

  // Try to get name
  if (user.user_metadata?.name) {
    return user.user_metadata.name
  }

  // Fallback to email
  return user.email || "User"
}

/**
 * Calculate the number of working days between two dates, excluding weekends
 * For half-day requests, returns 0.5 days
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format (optional, defaults to startDate)
 * @param isHalfDay - Whether this is a half-day request
 * @returns number - Working days as a decimal (0.5 for half-day, whole numbers for full days)
 */
export function calculateWorkingDays(startDate: string, endDate?: string | null, isHalfDay: boolean = false): number {
  if (isHalfDay) {
    return 0.5;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  
  // Count only weekdays (exclude weekends)
  let workDays = 0;
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Sunday = 0, Saturday = 6, so exclude both
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workDays;
}

/**
 * Format working days with appropriate unit (day/days)
 * @param days - Number of working days (can be decimal for half-days)
 * @returns string - Formatted string like "1 day", "2 days", "0.5 days"
 */
export function formatWorkingDays(days: number): string {
  if (days === 0.5) {
    return "0.5 days";
  }
  return `${days} ${days === 1 ? "day" : "days"}`;
}

// Card styling utilities for homepage
export const cardColors = ["green", "blue", "purple"];

export function getCardStyle(color: string) {
  const commonStyles =
    "text-white border-b-8 hover:brightness-105 transition-all duration-200 ease-in-out";
  switch (color) {
    case "green":
      return `bg-duo-green border-[var(--duo-green-dark)] ${commonStyles}`;
    case "blue":
      return `bg-duo-blue border-[var(--duo-blue-dark)] ${commonStyles}`;
    case "purple":
      return `bg-duo-purple border-[var(--duo-purple-dark)] ${commonStyles}`;
    default:
      return commonStyles;
  }
} 