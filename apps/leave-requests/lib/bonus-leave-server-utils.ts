import { createServerClient } from "@workspace/supabase";
import type { BonusLeaveSummary } from "./bonus-leave-utils";

/**
 * Get all bonus leave grants across all users (admin view) - Server version
 */
export async function getAllBonusLeaveGrantsServer(year?: number): Promise<BonusLeaveSummary[]> {
  const supabase = await createServerClient();
  
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