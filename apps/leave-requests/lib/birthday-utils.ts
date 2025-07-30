/**
 * Check if today is the user's birthday
 * @param dateOfBirth - The user's date of birth in YYYY-MM-DD format
 * @returns boolean - true if today is the user's birthday
 */
export function isBirthdayToday(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false;
  
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if month and day match (ignore year)
    return today.getMonth() === birthDate.getMonth() && 
           today.getDate() === birthDate.getDate();
  } catch (error) {
    console.error('Error parsing date of birth:', error);
    return false;
  }
}

/**
 * Get the user's age based on their date of birth
 * @param dateOfBirth - The user's date of birth in YYYY-MM-DD format
 * @returns number - The user's age, or null if date is invalid
 */
export function getAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Set both dates to the same year for comparison
    const todayThisYear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // If birthday hasn't occurred yet this year, subtract 1
    if (todayThisYear < birthdayThisYear) {
      age--;
    }
    
    // Ensure age is not negative
    return Math.max(0, age);
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

/**
 * Format birthday message with age
 * @param userName - The user's name
 * @param dateOfBirth - The user's date of birth
 * @returns string - Formatted birthday message
 */
export function getBirthdayMessage(userName: string, dateOfBirth: string | null | undefined): string {
  const age = getAge(dateOfBirth);
  
  if (age !== null && age > 0) {
    return `Happy ${age}${getAgeSuffix(age)} Birthday, ${userName}!`;
  }
  
  return `Happy Birthday, ${userName}!`;
}

/**
 * Get the appropriate suffix for age numbers
 * @param age - The age number
 * @returns string - The appropriate suffix (st, nd, rd, th)
 */
function getAgeSuffix(age: number): string {
  if (age >= 11 && age <= 13) return 'th';
  
  const lastDigit = age % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Debug function to test age calculation
 * @param dateOfBirth - The date of birth to test
 * @returns object with debug information
 */
export function debugAgeCalculation(dateOfBirth: string): {
  age: number | null;
  today: Date;
  birthDate: Date;
  todayThisYear: Date;
  birthdayThisYear: Date;
  hasOccurred: boolean;
} {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const todayThisYear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasOccurred = todayThisYear >= birthdayThisYear;
  
  if (!hasOccurred) {
    age--;
  }
  
  return {
    age: Math.max(0, age),
    today,
    birthDate,
    todayThisYear,
    birthdayThisYear,
    hasOccurred
  };
} 