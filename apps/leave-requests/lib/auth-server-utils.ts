import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Get the current authenticated user session
 * @returns Promise<Session | null>
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current authenticated user
 * @returns Promise<User | null>
 */
export async function getUser() {
  const session = await auth()
  return session?.user || null
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param redirectTo - Path to redirect to if not authenticated (default: '/auth/login')
 * @returns Promise<User> - Returns user if authenticated, redirects if not
 */
export async function requireAuth(redirectTo = '/auth/login') {
  const session = await auth()
  
  if (!session?.user) {
    redirect(redirectTo)
  }
  
  return session.user
}

/**
 * Check if user is authenticated without redirecting
 * @returns Promise<boolean>
 */
export async function isAuthenticated() {
  const session = await auth()
  return !!session?.user
}
