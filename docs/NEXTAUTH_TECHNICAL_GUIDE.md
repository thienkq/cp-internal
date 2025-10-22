# NextAuth.js Technical Implementation Guide

## 🔧 Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
cd apps/leave-requests
npm install next-auth@beta @auth/drizzle-adapter @auth/core
```

### Step 2: Create NextAuth Configuration

Create `auth.ts` in project root (`apps/leave-requests/auth.ts`):

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "@/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch role from database
        const db = getDb()
        const { users } = await import("@/db/schema")
        const { eq } = await import("drizzle-orm")
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
        
        if (dbUser) {
          session.user.role = dbUser.role
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Restrict signup by email domain (if needed)
      const allowedDomains = ["coderpush.com"]
      const email = user.email || ""
      const domain = email.split("@")[1]
      
      if (!allowedDomains.includes(domain)) {
        return false
      }
      
      return true
    },
  },
  events: {
    async signIn({ user }) {
      // Sync user to your users table if needed
      const db = getDb()
      const { users } = await import("@/db/schema")
      const { eq } = await import("drizzle-orm")
      
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
      
      if (!existing) {
        await db.insert(users).values({
          id: user.id,
          email: user.email || "",
          full_name: user.name || "",
          role: "employee",
        })
      }
    },
  },
})
```

### Step 3: Create API Route

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

### Step 4: Create Database Migrations

Create `drizzle/migrations/[timestamp]_add_nextauth_tables.sql`:

```sql
-- NextAuth.js Account table
CREATE TABLE IF NOT EXISTS "accounts" (
  "userId" text NOT NULL,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- NextAuth.js Session table
CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionToken" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "expires" timestamp NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- NextAuth.js Verification Token table
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "email" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("email", "token")
);

-- Update users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" timestamp;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
```

### Step 5: Update Middleware

Replace `middleware.ts`:

```typescript
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  // Public routes
  const publicRoutes = ["/", "/auth/login", "/auth/error", "/auth/signin"]
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes
  if (!session) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

### Step 6: Update Auth Utilities

Replace `lib/auth-utils.ts`:

```typescript
import { auth } from "@/auth"
import { getDb } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const db = getDb()
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))

  return user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

export async function ensureUserExists(sessionUser: any) {
  const db = getDb()
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))

  if (existing.length === 0) {
    await db.insert(users).values({
      id: sessionUser.id,
      email: sessionUser.email || "",
      full_name: sessionUser.name || "",
      role: "employee",
    })
  }
}
```

### Step 7: Update Sign-In Button

Replace `components/google-sign-in-button.tsx`:

```typescript
"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function GoogleSignInButton() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  return (
    <button
      onClick={() =>
        signIn("google", {
          redirectTo: callbackUrl,
        })
      }
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      Sign in with Google
    </button>
  )
}
```

### Step 8: Update Logout Button

Replace `components/logout-button.tsx`:

```typescript
"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          redirectTo: "/auth/login",
        })
      }
      className="w-full px-4 py-2 text-left hover:bg-gray-100"
    >
      Logout
    </button>
  )
}
```

### Step 9: Update Environment Variables

Update `.env.local`:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_min_32_chars_generate_with_openssl

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Database (existing)
DATABASE_URL=postgresql://...
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### Step 10: Update Session Type

Create `types/next-auth.d.ts`:

```typescript
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    role?: string
  }
}
```

---

## 🧪 Testing Checklist

```typescript
// Test 1: Sign in with Google
// Navigate to /auth/login
// Click "Sign in with Google"
// Verify redirect to Google
// Verify callback works
// Verify session created

// Test 2: Protected routes
// Try accessing /dashboard without session
// Verify redirect to /auth/login
// Sign in
// Verify access to /dashboard

// Test 3: Logout
// Click logout button
// Verify session cleared
// Verify redirect to /auth/login

// Test 4: Database
// Verify user created in users table
// Verify session stored in sessions table
// Verify account stored in accounts table
```

---

## 🔄 Migration from Supabase

### Remove Supabase

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

### Update Imports

Replace all:
```typescript
import { createServerClient } from "@workspace/supabase"
```

With:
```typescript
import { auth } from "@/auth"
```

### Remove Supabase Files

- Delete `packages/supabase/` (or keep for other uses)
- Delete `supabase/config.toml`
- Delete `supabase/migrations/`

---

## 🚀 Deployment

### Vercel

1. Add environment variables in Vercel dashboard
2. Deploy normally
3. NextAuth.js works out of the box

### Self-Hosted

1. Set `NEXTAUTH_URL` to your domain
2. Generate strong `NEXTAUTH_SECRET`
3. Ensure database is accessible
4. Deploy

---

## 📊 Database Schema

NextAuth.js creates these tables automatically:

```
accounts
├── userId (FK to users)
├── provider (google, github, etc.)
├── providerAccountId
├── access_token
├── refresh_token
└── expires_at

sessions
├── sessionToken (unique)
├── userId (FK to users)
└── expires

verification_tokens
├── email
├── token
└── expires
```

Your existing `users` table is extended with `emailVerified`.

---

## 🔐 Security Best Practices

1. **NEXTAUTH_SECRET** - Generate with `openssl rand -base64 32`
2. **HTTPS** - Always use HTTPS in production
3. **Secure Cookies** - Automatically set by NextAuth.js
4. **CSRF Protection** - Built-in
5. **Email Verification** - Optional, can be enabled
6. **Rate Limiting** - Implement at API level

---

## 📚 Additional Resources

- [NextAuth.js Docs](https://authjs.dev/)
- [Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Google Provider Config](https://authjs.dev/reference/providers/google)
- [Session Callbacks](https://authjs.dev/reference/nextjs#callbacks)

