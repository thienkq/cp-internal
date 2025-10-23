import { getDb } from '@/db';
import { bonusLeaveGrants, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { BonusLeaveSummary } from "./bonus-leave-utils";

/**
 * Get all bonus leave grants across all users (admin view) - Server version
 */
export async function getAllBonusLeaveGrantsServer(year?: number): Promise<BonusLeaveSummary[]> {
  const db = getDb();
  
  try {
    let whereConditions = [];
    
    if (year) {
      whereConditions.push(eq(bonusLeaveGrants.year, year));
    }
    
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(bonusLeaveGrants.created_at));
    
    if (!grants || grants.length === 0) {
      return [];
    }
  
    // Group by user and year
    const grouped: Record<string, BonusLeaveSummary> = {};
    
    grants.forEach(grant => {
      const key = `${grant.user_id}-${grant.year}`;
      if (!grouped[key]) {
        grouped[key] = {
          user_id: grant.user_id,
          full_name: grant.full_name || 'Unknown User',
          year: grant.year,
          total_granted: 0,
          total_used: 0,
          remaining: 0,
          grants: []
        };
      }
      
      grouped[key].total_granted += grant.days_granted;
      grouped[key].total_used += grant.days_used || 0;
      grouped[key].grants.push({
        id: grant.id,
        user_id: grant.user_id,
        year: grant.year,
        days_granted: grant.days_granted,
        days_used: grant.days_used || 0,
        reason: grant.reason || undefined,
        granted_by: grant.granted_by,
        granted_at: grant.granted_at || '',
        created_at: grant.created_at || '',
        updated_at: grant.updated_at || ''
      });
    });
    
    // Calculate remaining for each group
    Object.values(grouped).forEach(summary => {
      summary.remaining = summary.total_granted - summary.total_used;
    });
    
    return Object.values(grouped).sort((a, b) => {
      // Sort by year descending, then by user name
      if (a.year !== b.year) return b.year - a.year;
      return a.full_name.localeCompare(b.full_name);
    });
  } catch (error) {
    console.error("Error fetching all bonus leave grants:", error);
    return [];
  }
} 