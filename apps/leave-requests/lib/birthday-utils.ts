import { createServerClient } from "@workspace/supabase";

export interface BirthdayInfo {
  user_id: string;
  full_name: string;
  date_of_birth: string;
  birthday_date: Date;
  age: number;
  days_until: number;
}

/**
 * Get birthdays for the current month only
 * Only includes users with valid date of birth
 */
export async function getThisMonthBirthdays(): Promise<BirthdayInfo[]> {
  const supabase = await createServerClient();
  
  // Get all users with date of birth
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, date_of_birth")
    .not("date_of_birth", "is", null)
    .eq("is_active", true);
  
  if (!users) return [];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const thisMonthBirthdays = [];
  
  for (const user of users) {
    const birthDate = new Date(user.date_of_birth);
    const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // Check if birthday is in current month
    if (birthdayThisYear.getMonth() === currentMonth) {
      const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const age = currentYear - birthDate.getFullYear();
      
      // Include all birthdays in the current month (including passed ones)
      thisMonthBirthdays.push({
        user_id: user.id,
        full_name: user.full_name,
        date_of_birth: user.date_of_birth,
        birthday_date: birthdayThisYear,
        age,
        days_until: daysUntil
      });
    }
  }
  
  // Sort by day of month
  return thisMonthBirthdays.sort((a, b) => a.birthday_date.getDate() - b.birthday_date.getDate());
}

/**
 * Check if today is a user's birthday
 */
export function isBirthdayToday(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  return birthDate.getMonth() === today.getMonth() && 
         birthDate.getDate() === today.getDate();
}

/**
 * Get birthday message with age
 */
export function getBirthdayMessage(fullName: string, age: number): string {
  const ordinalSuffix = getOrdinalSuffix(age);
  return `Happy ${age}${ordinalSuffix} Birthday, ${fullName}! 🎉`;
}

/**
 * Get ordinal suffix for numbers
 */
export function getOrdinalSuffix(num: number): string {
  if (num >= 11 && num <= 13) return 'th';
  
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 