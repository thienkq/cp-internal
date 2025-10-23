'use server';

import { getDb } from '@/db';
import { bonusLeaveGrants, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface GrantBonusLeaveData {
  user_id: string;
  year: number;
  days_granted: number;
  reason?: string;
}

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

/**
 * Grant bonus leave to a user - Server Action
 */
export async function grantBonusLeave(data: GrantBonusLeaveData, grantedBy: string): Promise<BonusLeaveGrant | null> {
  const db = getDb();
  
  try {
    const [grant] = await db
      .insert(bonusLeaveGrants)
      .values({
        user_id: data.user_id,
        year: data.year,
        days_granted: data.days_granted,
        reason: data.reason,
        granted_by: grantedBy,
      })
      .returning();
    
    if (!grant) {
      return null;
    }
    
    // Revalidate the admin page to show updated data
    revalidatePath('/admin/bonus-leave');
    
    return {
      id: grant.id,
      user_id: grant.user_id,
      year: grant.year,
      days_granted: grant.days_granted,
      days_used: grant.days_used || 0,
      reason: grant.reason || undefined,
      granted_by: grant.granted_by,
      granted_at: grant.granted_at || '',
      created_at: grant.created_at || '',
      updated_at: grant.updated_at || '',
    };
  } catch (error) {
    console.error('Error granting bonus leave:', error);
    return null;
  }
}

/**
 * Get all bonus leave grants across all users (admin view) - Server Action
 */
export async function getAllBonusLeaveGrants(year?: number): Promise<BonusLeaveSummary[]> {
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
    console.error('Error fetching all bonus leave grants:', error);
    return [];
  }
}

/**
 * Delete bonus leave grant - Server Action
 */
export async function deleteBonusLeaveGrant(grantId: string): Promise<boolean> {
  const db = getDb();
  
  try {
    await db
      .delete(bonusLeaveGrants)
      .where(eq(bonusLeaveGrants.id, grantId));
    
    // Revalidate the admin page to show updated data
    revalidatePath('/admin/bonus-leave');
    
    return true;
  } catch (error) {
    console.error('Error deleting bonus leave grant:', error);
    return false;
  }
}
