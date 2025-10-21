/**
 * Client-safe utility functions
 * These functions don't use any server-side dependencies and can be safely imported in client components
 */

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
  } else if (years === 4) {
    return `Happy 4th Work Anniversary, ${fullName}! 🎯`;
  } else if (years === 5) {
    return `Happy 5th Work Anniversary, ${fullName}! 🥳`;
  } else if (years === 10) {
    return `Happy 10th Work Anniversary, ${fullName}! 🎊🎉`;
  } else if (years === 15) {
    return `Happy 15th Work Anniversary, ${fullName}! 🏆🎉`;
  } else if (years === 20) {
    return `Happy 20th Work Anniversary, ${fullName}! 🎊🏆`;
  } else if (years === 25) {
    return `Happy 25th Work Anniversary, ${fullName}! 🏆🎊`;
  } else if (years >= 30) {
    return `Happy ${years}th Work Anniversary, ${fullName}! 🎊🏆🎉`;
  } else {
    const ordinalSuffix = getOrdinalSuffix(years);
    return `Happy ${years}${ordinalSuffix} Work Anniversary, ${fullName}! 🎉`;
  }
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
