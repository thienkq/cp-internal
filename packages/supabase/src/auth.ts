import { createServerClient } from "./server";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current authenticated user from the server-side Supabase client
 * @returns Promise<{ user: User | null, supabase: Awaited<ReturnType<typeof createServerClient>> }>
 * 
 * @example
 * // In a server component or API route
 * const { user, supabase } = await getCurrentUser();
 * if (user) {
 *   // User is authenticated
 *   const { data } = await supabase.from('profiles').select('*').eq('id', user.id);
 * }
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
}

/**
 * Get the current authenticated user (without the Supabase client)
 * @returns Promise<User | null>
 * 
 * @example
 * // In a server component
 * const user = await getUser();
 * if (user) {
 *   return <div>Welcome, {user.email}!</div>;
 * }
 */
export async function getUser(): Promise<User | null> {
  const { user } = await getCurrentUser();
  return user;
}

/**
 * Check if user is authenticated and redirect if not
 * @param redirectTo - Path to redirect to if not authenticated (default: '/auth/login')
 * @returns Promise<{ user: User, supabase: Awaited<ReturnType<typeof createServerClient>> }> - Throws if not authenticated
 * 
 * @example
 * // In a protected page or API route
 * try {
 *   const { user, supabase } = await requireAuth();
 *   // User is guaranteed to be authenticated here
 *   return <div>Protected content for {user.email}</div>;
 * } catch (error) {
 *   // Handle authentication error
 *   redirect('/auth/login');
 * }
 */
export async function requireAuth(redirectTo = '/auth/login') {
  const { user, supabase } = await getCurrentUser();
  
  if (!user) {
    // In a server component, you might want to redirect or throw an error
    // For now, we'll throw an error that can be caught by the calling component
    throw new Error('Authentication required');
  }
  
  return { user, supabase };
} 