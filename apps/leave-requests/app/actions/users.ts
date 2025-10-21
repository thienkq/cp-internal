"use server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/types";
import { requireRole, requireAuth } from "@/lib/auth-utils";

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user as User | null;
}

export async function getActiveUsers(): Promise<Pick<User, 'id' | 'full_name' | 'email'>[]> {
  const db = getDb();
  const result = await db
    .select({ 
      id: users.id, 
      full_name: users.full_name, 
      email: users.email 
    })
    .from(users)
    .where(eq(users.is_active, true));
  return result;
}

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: User; error?: string }> {
  // TODO: Add authorization check (admin only)
  await requireRole(["admin"]);
  try {
    const db = getDb();
    const [newUser] = await db.insert(users).values(userData).returning();
    return { success: true, data: newUser as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUser(userId: string, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: User; error?: string }> {
  // TODO: Add authorization check (admin only or user updating own profile)
  await requireRole(["admin"]);
  try {
    const db = getDb();
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updated_at: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning();
    return { success: true, data: updatedUser as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Add authorization check (admin only)
  await requireRole(["admin"]);
  try {
    const db = getDb();
    await db.delete(users).where(eq(users.id, userId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
