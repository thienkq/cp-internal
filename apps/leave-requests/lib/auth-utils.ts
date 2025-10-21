import { createServerClient } from "@workspace/supabase";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  // Query users table to get role
  const db = getDb();
  const [userRecord] = await db.select().from(users).where(eq(users.id, user.id));
  
  if (!userRecord || !allowedRoles.includes(userRecord.role)) {
    throw new Error("Forbidden");
  }
  
  return { user, userRecord };
}

export async function ensureUserExists(supabaseUser: any) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.id, supabaseUser.id));
  
  if (existing.length === 0) {
    await db.insert(users).values({
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: supabaseUser.user_metadata?.full_name || "",
      role: "employee",
    });
  }
}
