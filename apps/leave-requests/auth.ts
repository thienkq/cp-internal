import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "@/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable")
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable")
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable")
}

const nextAuth = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
      console.log("=== signIn callback START ===")
      console.log("Google user ID:", user.id, "Email:", user.email)
      console.log("Account provider:", account?.provider)

      try {
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
        return false
      }

      console.log("=== signIn callback END - user.id is now:", user.id, "===")
      return true
    },

    async session({ session, user }) {
      console.log("=== session callback START ===")
      console.log("Session object:", JSON.stringify(session, null, 2))
      console.log("User object:", JSON.stringify(user, null, 2))

      // Add user data to session
      if (session.user && user) {
        session.user.id = user.id
        session.user.role = (user as any).role as string
        console.log("Session user updated with ID:", session.user.id, "Role:", session.user.role)
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