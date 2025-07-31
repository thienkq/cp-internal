import { createServerClient, createBrowserClient } from "@workspace/supabase";

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
  const supabase = await createServerClient();
  
  let query = supabase
    .from("bonus_leave_grants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (year) {
    query = query.eq("year", year);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching bonus leave grants:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get bonus leave summary for a user (total granted, used, remaining)
 */
export async function getUserBonusLeaveSummary(userId: string, year: number): Promise<BonusLeaveSummary | null> {
  const supabase = await createServerClient();
  
  // Get all grants for the user in the specified year
  const { data: grants, error } = await supabase
    .from("bonus_leave_grants")
    .select(`
      *,
      users:users!bonus_leave_grants_user_id_fkey(full_name)
    `)
    .eq("user_id", userId)
    .eq("year", year);
  
  if (error) {
    console.error("Error fetching bonus leave summary:", error);
    return null;
  }
  
  if (!grants || grants.length === 0) {
    return null;
  }
  
  const totalGranted = grants.reduce((sum, grant) => sum + grant.days_granted, 0);
  const totalUsed = grants.reduce((sum, grant) => sum + grant.days_used, 0);
  const remaining = totalGranted - totalUsed;
  
  return {
    user_id: userId,
    full_name: grants[0].users.full_name,
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
}

/**
 * Grant bonus leave to a user
 */
export async function grantBonusLeave(data: GrantBonusLeaveData, grantedBy: string): Promise<BonusLeaveGrant | null> {
  // Use browser client since this is called from client components
  const supabase = createBrowserClient();
  
  const { data: grant, error } = await supabase
    .from("bonus_leave_grants")
    .insert({
      user_id: data.user_id,
      year: data.year,
      days_granted: data.days_granted,
      reason: data.reason,
      granted_by: grantedBy
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error granting bonus leave:", error);
    console.error("Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }
  
  return grant;
}

/**
 * Get all bonus leave grants across all users (admin view)
 */
export async function getAllBonusLeaveGrants(year?: number): Promise<BonusLeaveSummary[]> {
  const supabase = createBrowserClient();
  
  let query = supabase
    .from("bonus_leave_grants")
    .select(`
      *,
      user:users!bonus_leave_grants_user_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });
  
  if (year) {
    query = query.eq("year", year);
  }
  
  const { data: grants, error } = await query;
  
  if (error) {
    console.error("Error fetching all bonus leave grants:", error);
    return [];
  }
  
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
        full_name: grant.user.full_name,
        year: grant.year,
        total_granted: 0,
        total_used: 0,
        remaining: 0,
        grants: []
      };
    }
    
    grouped[key].total_granted += grant.days_granted;
    grouped[key].total_used += grant.days_used;
    grouped[key].grants.push({
      id: grant.id,
      user_id: grant.user_id,
      year: grant.year,
      days_granted: grant.days_granted,
      days_used: grant.days_used,
      reason: grant.reason,
      granted_by: grant.granted_by,
      granted_at: grant.granted_at,
      created_at: grant.created_at,
      updated_at: grant.updated_at
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
}

/**
 * Delete a bonus leave grant
 */
export async function deleteBonusLeaveGrant(grantId: string): Promise<boolean> {
  // Use browser client since this is called from client components
  const supabase = createBrowserClient();
  
  const { error } = await supabase
    .from("bonus_leave_grants")
    .delete()
    .eq("id", grantId);
  
  if (error) {
    console.error("Error deleting bonus leave grant:", error);
    return false;
  }
  
  return true;
} 