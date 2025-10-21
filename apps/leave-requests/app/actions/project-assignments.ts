"use server";

import { getDb } from "@/db";
import { projectAssignments, users, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ProjectAssignment } from "@/types";

export async function getProjectAssignmentsByUserId(userId: string): Promise<any[]> {
  const db = getDb();
  const result = await db
    .select({
      id: projectAssignments.id,
      user_id: projectAssignments.user_id,
      project_id: projectAssignments.project_id,
      role: projectAssignments.role,
      is_lead: projectAssignments.is_lead,
      start_date: projectAssignments.start_date,
      end_date: projectAssignments.end_date,
      status: projectAssignments.status,
      assigned_by: projectAssignments.assigned_by,
      assigned_at: projectAssignments.assigned_at,
      updated_at: projectAssignments.updated_at,
      project: {
        id: projects.id,
        name: projects.name
      }
    })
    .from(projectAssignments)
    .leftJoin(projects, eq(projectAssignments.project_id, projects.id))
    .where(eq(projectAssignments.user_id, userId))
    .orderBy(projectAssignments.assigned_at);
  return result;
}

export async function createProjectAssignment(assignmentData: Omit<ProjectAssignment, 'id' | 'assigned_at' | 'updated_at'>): Promise<{ success: boolean; data?: ProjectAssignment; error?: string }> {
  try {
    const db = getDb();
    const [newAssignment] = await db.insert(projectAssignments).values(assignmentData).returning();
    return { success: true, data: newAssignment as ProjectAssignment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectAssignment(assignmentId: string, assignmentData: Partial<Omit<ProjectAssignment, 'id' | 'assigned_at' | 'updated_at'>>): Promise<{ success: boolean; data?: ProjectAssignment; error?: string }> {
  try {
    const db = getDb();
    const [updatedAssignment] = await db
      .update(projectAssignments)
      .set({ ...assignmentData, updated_at: new Date().toISOString() })
      .where(eq(projectAssignments.id, assignmentId))
      .returning();
    return { success: true, data: updatedAssignment as ProjectAssignment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAssignment(assignmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.delete(projectAssignments).where(eq(projectAssignments.id, assignmentId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkCreateProjectAssignments(assignments: Array<{
  user_id: string;
  project_id: string;
  role: string;
  is_lead: boolean;
  start_date: string;
  end_date?: string;
  assigned_by: string;
  status: string;
}>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.insert(projectAssignments).values(assignments);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
