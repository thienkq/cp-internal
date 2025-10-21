"use server";
import { bulkCreateProjectAssignments } from "@/app/actions/project-assignments";

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
  const rows = assignments.map(a => ({
    ...a,
    project_id: projectId,
    assigned_by: assignedBy,
    status: "active",
  }));
  
  return await bulkCreateProjectAssignments(rows);
} 