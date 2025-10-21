"use server";

import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Project } from "@/types";

export async function getAllProjects(): Promise<Project[]> {
  const db = getDb();
  const result = await db
    .select()
    .from(projects)
    .orderBy(projects.created_at);
  return result as Project[];
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  return project as Project | null;
}

export async function createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const db = getDb();
    const [newProject] = await db.insert(projects).values(projectData).returning();
    return { success: true, data: newProject as Project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProject(projectId: string, projectData: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const db = getDb();
    const [updatedProject] = await db
      .update(projects)
      .set({ ...projectData, updated_at: new Date().toISOString() })
      .where(eq(projects.id, projectId))
      .returning();
    return { success: true, data: updatedProject as Project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
