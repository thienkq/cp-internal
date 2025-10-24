import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb, getDbSafe, withRetry, checkDatabaseHealth, warmUpConnection } from "@/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

// Validate environment variables at runtime, not build time
const validateEnvVars = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable")
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable")
  }

  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("Missing NEXTAUTH_SECRET environment variable")
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable")
  }

  if (!process.env.NEXTAUTH_URL) {
    throw new Error("Missing NEXTAUTH_URL environment variable")
  }
}

// Validate database connection with retry logic (optimized for serverless)
const validateDatabase = async () => {
  try {
    console.log("Starting database validation for serverless environment...")
    
    // Warm up connection first in production
    await warmUpConnection()
    
    // First check database health with longer timeout
    const isHealthy = await withRetry(async () => {
      return await checkDatabaseHealth()
    }, 2, 5000) // 2 retries, 5 second delay
    
    if (!isHealthy) {
      throw new Error("Database health check failed")
    }
    
    // Test with retry logic optimized for serverless
    await withRetry(async () => {
      const db = getDb()
      // Test database connection with a simple query
      await db.select().from(users).limit(1)
      console.log("Database connection validated successfully")
      
      // Test accounts table specifically
      await db.select().from(accounts).limit(1)
      console.log("Accounts table accessible")
      
      // Test sessions table specifically  
      await db.select().from(sessions).limit(1)
      console.log("Sessions table accessible")
    }, 2, 3000) // 2 retries, 3 second delay for serverless
    
  } catch (error) {
    console.error("Database connection validation failed:", error)
    console.error("Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    })
    throw new Error("Database connection failed: " + (error as Error).message)
  }
}

// Create a more robust database adapter
const createAdapter = () => {
  try {
    const db = getDb()
    return DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  } catch (error) {
    console.error("Failed to create database adapter:", error)
    throw new Error("Database adapter creation failed: " + (error as Error).message)
  }
}

const nextAuth = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  adapter: createAdapter() as any, // Type assertion to bypass version conflict
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id-for-build",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret-for-build",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  basePath: "/api/auth",
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      // Validate environment variables at runtime
      validateEnvVars()
      
      console.log("=== signIn callback START ===")
      console.log("Google user ID:", user.id, "Email:", user.email)
      console.log("Account provider:", account?.provider)

      try {
        // Validate database connection first
        await validateDatabase()
        
        const db = getDb()

        // Find existing user by email
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email || ""))
          .limit(1)

        if (existingUser.length > 0) {
          const dbUser = existingUser[0]
          if (dbUser) {
            console.log("Found existing user with ID:", dbUser.id)

            // Update user.id to the database UUID so the adapter uses it
            user.id = dbUser.id

            // Update user name and image if not set
            if (!dbUser.name && user.name) {
              await db.update(users).set({
                name: user.name,
                image: user.image,
              }).where(eq(users.id, dbUser.id))
              console.log("Updated user name and image")
            }
          }
        } else {
          console.log("No existing user found with email:", user.email)
          console.log("Creating new user...")

          // Create new user with default role
          const newUser = await db.insert(users).values({
            id: randomUUID(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: 'employee', // Default role
            is_active: true,
          }).returning()

          if (newUser.length > 0 && newUser[0]) {
            user.id = newUser[0].id
            console.log("Created new user with ID:", user.id)
          } else {
            console.log("Failed to create new user")
            return false
          }
        }
      } catch (error) {
        console.error("Error in signIn callback:", error)
        console.error("Error details:", {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        })
        return false
      }

      console.log("=== signIn callback END - user.id is now:", user.id, "===")
      return true
    },

    async session({ session, user }) {
      console.log("=== session callback START ===")
      console.log("Session object:", JSON.stringify(session, null, 2))
      console.log("User object:", JSON.stringify(user, null, 2))

      // Add ALL user data to session for optimization
      if (session.user && user) {
        const userData = user as any; // Type assertion for database user fields
        session.user.id = user.id
        session.user.role = userData.role as string
        session.user.full_name = userData.full_name as string
        session.user.email = user.email
        session.user.name = user.name
        session.user.image = user.image
        session.user.date_of_birth = userData.date_of_birth as string
        session.user.start_date = userData.start_date as string
        session.user.end_date = userData.end_date as string
        session.user.gender = userData.gender as string
        session.user.position = userData.position as string
        session.user.phone = userData.phone as string
        session.user.is_active = userData.is_active as boolean
        session.user.manager_id = userData.manager_id as string
        session.user.created_at = userData.created_at as string
        session.user.updated_at = userData.updated_at as string
        console.log("Session user updated with all fields:", session.user.id, "Role:", session.user.role)
      } else {
        console.log("Missing session.user or user object")
      }

      console.log("=== session callback END ===")
      console.log("Final session object:", JSON.stringify(session, null, 2))
      return session
    },

    async redirect({ url, baseUrl }) {
      console.log("=== Redirect callback ===")
      console.log("url:", url)
      console.log("baseUrl:", baseUrl)
      console.log("url.startsWith('/'):", url.startsWith("/"))

      // For OAuth callback, redirect to dashboard
      if (url.includes('/api/auth/callback')) {
        console.log("OAuth callback detected, redirecting to /dashboard")
        return `${baseUrl}/dashboard`
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log("Redirecting to relative URL:", redirectUrl)
        return redirectUrl
      }

      // Allows callback URLs on the same origin
      try {
        const urlOrigin = new URL(url).origin
        console.log("urlOrigin:", urlOrigin)
        if (urlOrigin === baseUrl) {
          console.log("Redirecting to same origin:", url)
          return url
        }
      } catch (error) {
        console.error("Error parsing redirect URL:", error)
      }

      console.log("Redirecting to baseUrl/dashboard:", `${baseUrl}/dashboard`)
      return `${baseUrl}/dashboard`
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log(`=== signIn EVENT ===`)
      console.log(`User signed in: ${user.email}`)
      console.log(`User ID: ${user.id}`)
      console.log(`Account provider: ${account?.provider}`)
      console.log(`Account providerAccountId: ${account?.providerAccountId}`)
    },
    async signOut() {
      console.log("User signed out")
    },
    async session({ session }) {
      console.log("=== session event ===")
      console.log("Session event triggered:", session)
    },
    async createUser({ user }) {
      console.log("=== createUser event ===")
      console.log("User created:", user)
    },
    async linkAccount({ user, account }) {
      console.log("=== linkAccount event ===")
      console.log("Account linked for user:", user.id)
      console.log("Account:", account)
    },
    // Note: error event handler is not available in current NextAuth version
    // Error handling is done through try-catch blocks in callbacks
  },

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
})

export const { handlers, auth, signIn, signOut } = nextAuth as any