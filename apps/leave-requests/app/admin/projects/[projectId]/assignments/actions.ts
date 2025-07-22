"use server";
import { createServerClient } from "@workspace/supabase";

export async function bulkAssignUsers({
  projectId,
  assignments,
  assignedBy,
}: {
  projectId: string;
  assignments: Array<{
    user_id: string;
    role: string;
    is_lead: boolean;
    start_date: string;
    end_date?: string;
  }>;
  assignedBy: string;
}) {
  const supabase = await createServerClient();
  const rows = assignments.map(a => ({
    ...a,
    project_id: projectId,
    assigned_by: assignedBy,
    status: "active",
  }));
  const { error } = await supabase.from("project_assignments").insert(rows);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
} 