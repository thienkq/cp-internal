import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user from the database
 * Returns just the user object (not { user, supabase })
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  return user || null;
}

/**
 * Get the current authenticated user with Supabase client
 * This is for compatibility with code that expects { user, supabase }
 * Since we're using NextAuth now, we don't have a Supabase client
 * but we return the user for compatibility
 */
export async function getCurrentUserWithClient() {
  const user = await getCurrentUser();
  return { user, supabase: null };
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

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function ensureUserExists(nextAuthUser: any) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.id, nextAuthUser.id));

  if (existing.length === 0) {
    await db.insert(users).values({
      id: nextAuthUser.id,
      email: nextAuthUser.email,
      full_name: nextAuthUser.name || "",
      role: "employee",
    });
  }
}
