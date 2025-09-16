import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

/**
 * User Database Utilities
 * 
 * This module provides reusable functions for user-related database operations using Drizzle ORM.
 * 
 * @example
 * ```typescript
 * // Check if user is admin
 * const isAdmin = await isUserAdmin(userId);
 * 
 * // Get user data with role validation
 * try {
 *   const adminUser = await getAdminUser(userId);
 *   console.log(adminUser.full_name);
 * } catch (error) {
 *   console.error("User is not admin");
 * }
 * 
 * // Check multiple roles
 * const isManagerOrAdmin = await isUserManagerOrAdmin(userId);
 * ```
 */

/**
 * User role type definition
 */
export type UserRole = "employee" | "manager" | "admin";

/**
 * User data from database
 */
export interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | string;
  start_date: string | null;
  end_date: string | null;
  gender: string | null;
  position: string | null;
  phone: string | null;
  date_of_birth: string | null;
  is_active: boolean | null;
  manager_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Get user data by ID using Drizzle ORM
 * @param userId - User ID to query
 * @returns Promise<UserData | null> - User data or null if not found
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  try {
    const db = getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

/**
 * Get user role by ID using Drizzle ORM
 * @param userId - User ID to query
 * @returns Promise<UserRole | null> - User role or null if not found
 */
export async function getUserRole(userId: string): Promise<UserRole | string | null> {
  try {
    const db = getDb();
    const result = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0]?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
}

/**
 * Check if user has specific role
 * @param userId - User ID to check
 * @param role - Role to check against
 * @returns Promise<boolean> - True if user has the role
 */
export async function hasUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return userRole === role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Check if user is admin
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  return hasUserRole(userId, "admin");
}

/**
 * Check if user is manager
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is manager
 */
export async function isUserManager(userId: string): Promise<boolean> {
  return hasUserRole(userId, "manager");
}

/**
 * Check if user is employee
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is employee
 */
export async function isUserEmployee(userId: string): Promise<boolean> {
  return hasUserRole(userId, "employee");
}

/**
 * Check if user is manager or admin
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is manager or admin
 */
export async function isUserManagerOrAdmin(userId: string): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return userRole === "manager" || userRole === "admin";
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Get user data with role validation for admin access
 * Throws error if user is not found or not admin
 * @param userId - User ID to query
 * @returns Promise<UserData> - User data (guaranteed to be admin)
 * @throws Error if user not found or not admin
 */
export async function getAdminUser(userId: string): Promise<UserData> {
  const userData = await getUserById(userId);
  
  if (!userData) {
    throw new Error("User not found");
  }
  
  if (userData.role !== "admin") {
    throw new Error("User is not an admin");
  }
  
  return userData;
}

/**
 * Get user data with role validation for manager access
 * Throws error if user is not found or not manager/admin
 * @param userId - User ID to query
 * @returns Promise<UserData> - User data (guaranteed to be manager or admin)
 * @throws Error if user not found or not manager/admin
 */
export async function getManagerUser(userId: string): Promise<UserData> {
  const userData = await getUserById(userId);
  
  if (!userData) {
    throw new Error("User not found");
  }
  
  if (userData.role !== "manager" && userData.role !== "admin") {
    throw new Error("User is not a manager or admin");
  }
  
  return userData;
}
