"use server";

import { getDb } from "@/db";
import { extendedAbsences } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ExtendedAbsence } from "@/types";

export async function getExtendedAbsencesByUserId(userId: string): Promise<ExtendedAbsence[]> {
  const db = getDb();
  const result = await db
    .select()
    .from(extendedAbsences)
    .where(eq(extendedAbsences.user_id, userId))
    .orderBy(extendedAbsences.start_date);
  return result as ExtendedAbsence[];
}

export async function createExtendedAbsence(absenceData: Omit<ExtendedAbsence, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ExtendedAbsence; error?: string }> {
  try {
    const db = getDb();
    const [newAbsence] = await db.insert(extendedAbsences).values(absenceData).returning();
    return { success: true, data: newAbsence as ExtendedAbsence };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateExtendedAbsence(absenceId: string, absenceData: Partial<Omit<ExtendedAbsence, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: ExtendedAbsence; error?: string }> {
  try {
    const db = getDb();
    const [updatedAbsence] = await db
      .update(extendedAbsences)
      .set({ ...absenceData, updated_at: new Date().toISOString() })
      .where(eq(extendedAbsences.id, absenceId))
      .returning();
    return { success: true, data: updatedAbsence as ExtendedAbsence };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExtendedAbsence(absenceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.delete(extendedAbsences).where(eq(extendedAbsences.id, absenceId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
