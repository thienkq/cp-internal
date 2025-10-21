import { getDb } from '@/db';
import { bonusLeaveGrants, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createBrowserClient } from "@workspace/supabase";

export interface BonusLeaveGrant {
  id: string;
  user_id: string;
  year: number;
  days_granted: number;
  days_used: number;
  reason?: string;
  granted_by?: string | null;
  granted_at: string;
  created_at: string;
  updated_at: string;
}

export interface BonusLeaveSummary {
  user_id: string;
  full_name: string;
  year: number;
  total_granted: number;
  total_used: number;
  remaining: number;
  grants: BonusLeaveGrant[];
}

export interface GrantBonusLeaveData {
  user_id: string;
  year: number;
  days_granted: number;
  reason?: string;
}

/**
 * Get all bonus leave grants for a specific user
 */
export async function getUserBonusLeaveGrants(userId: string, year?: number): Promise<BonusLeaveGrant[]> {
  const db = getDb();
  
  let whereConditions = [eq(bonusLeaveGrants.user_id, userId)];
  
  if (year) {
    whereConditions.push(eq(bonusLeaveGrants.year, year));
  }
  
  try {
    const data = await db
      .select()
      .from(bonusLeaveGrants)
      .where(and(...whereConditions))
      .orderBy(desc(bonusLeaveGrants.created_at));
    
    return data || [];
  } catch (error) {
    console.error("Error fetching bonus leave grants:", error);
    return [];
  }
}

/**
 * Get bonus leave summary for a user (total granted, used, remaining)
 */
export async function getUserBonusLeaveSummary(userId: string, year: number): Promise<BonusLeaveSummary | null> {
  const db = getDb();
  
  try {
    // Get all grants for the user in the specified year with user info
    const grants = await db
      .select({
        id: bonusLeaveGrants.id,
        user_id: bonusLeaveGrants.user_id,
        year: bonusLeaveGrants.year,
        days_granted: bonusLeaveGrants.days_granted,
        days_used: bonusLeaveGrants.days_used,
        reason: bonusLeaveGrants.reason,
        granted_by: bonusLeaveGrants.granted_by,
        granted_at: bonusLeaveGrants.granted_at,
        created_at: bonusLeaveGrants.created_at,
        updated_at: bonusLeaveGrants.updated_at,
        full_name: users.full_name,
      })
      .from(bonusLeaveGrants)
      .leftJoin(users, eq(bonusLeaveGrants.user_id, users.id))
      .where(
        and(
          eq(bonusLeaveGrants.user_id, userId),
          eq(bonusLeaveGrants.year, year)
        )
      );
    
    if (!grants || grants.length === 0) {
      return null;
    }
    
    const totalGranted = grants.reduce((sum, grant) => sum + grant.days_granted, 0);
    const totalUsed = grants.reduce((sum, grant) => sum + grant.days_used, 0);
    const remaining = totalGranted - totalUsed;
    
    return {
      user_id: userId,
      full_name: grants[0].full_name || 'Unknown User',
      year,
      total_granted: totalGranted,
      total_used: totalUsed,
      remaining,
      grants: grants.map(grant => ({
        id: grant.id,
        user_id: grant.user_id,
        year: grant.year,
        days_granted: grant.days_granted,
        days_used: grant.days_used,
        reason: grant.reason,
        granted_by: grant.granted_by,
        granted_by_name: grant.granted_by_name,
        granted_at: grant.granted_at,
        created_at: grant.created_at,
        updated_at: grant.updated_at
      }))
    };
  } catch (error) {
    console.error("Error fetching bonus leave summary:", error);
    return null;
  }
}

// Note: grantBonusLeave moved to app/actions/bonus-leave.ts as server action

// Note: getAllBonusLeaveGrants and deleteBonusLeaveGrant moved to app/actions/bonus-leave.ts as server actions 