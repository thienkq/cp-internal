import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

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
  const db = getDb();
  
  // Get all users with date of birth
  const usersData = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      date_of_birth: users.date_of_birth,
    })
    .from(users)
    .where(
      and(
        eq(users.is_active, true),
        isNotNull(users.date_of_birth)
      )
    );
  
  if (!usersData) return [];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const thisMonthBirthdays = [];
  
  for (const user of usersData) {
    if (!user.date_of_birth) continue;
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

// Note: isBirthdayToday, getBirthdayMessage, and getOrdinalSuffix moved to client-utils.ts
// to avoid server-side dependencies in client components 