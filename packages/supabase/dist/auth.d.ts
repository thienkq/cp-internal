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
export declare function getCurrentUser(): Promise<{
    user: User | null;
    supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any, any>;
}>;
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
export declare function getUser(): Promise<User | null>;
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
export declare function requireAuth(redirectTo?: string): Promise<{
    user: User;
    supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any, any>;
}>;
//# sourceMappingURL=auth.d.ts.map