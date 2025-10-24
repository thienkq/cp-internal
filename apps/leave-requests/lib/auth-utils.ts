import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user from session (optimized - no DB query)
 * Returns user data from session for better performance
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // Return user data from session (no DB query for optimization)
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    full_name: session.user.full_name,
    role: session.user.role,
    start_date: session.user.start_date,
    end_date: session.user.end_date,
    gender: session.user.gender,
    position: session.user.position,
    phone: session.user.phone,
    date_of_birth: session.user.date_of_birth,
    is_active: session.user.is_active,
    manager_id: session.user.manager_id,
    created_at: session.user.created_at,
    updated_at: session.user.updated_at,
  };
}

/**
 * Get the current authenticated user from database (fresh data)
 * Use this when you need the latest user data from the database
 * This makes a DB query, so use sparingly for performance
 */
export async function getCurrentUserFromDb() {
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
