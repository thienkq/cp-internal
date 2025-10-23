# NextAuth.js Migration Plan: Complete Execution Guide

## 📋 Overview

Migrate from **Supabase Auth** to **NextAuth.js** for authentication while keeping PostgreSQL database and Drizzle ORM intact.

**Why NextAuth.js?**
- ✅ Industry standard for Next.js apps
- ✅ Built-in OAuth providers (Google, GitHub, etc.)
- ✅ Session management out of the box
- ✅ Database adapters for PostgreSQL
- ✅ Type-safe with TypeScript
- ✅ Active community and excellent documentation

---

## 🎯 Key Advantages Over Self-Coded OAuth

| Feature | Self-Coded | NextAuth.js |
|---------|-----------|-----------|
| **Setup Time** | 2-3 weeks | 2-3 days |
| **Security** | Your responsibility | Battle-tested |
| **OAuth Providers** | Manual for each | 50+ built-in |
| **Session Management** | Manual | Automatic |
| **Token Refresh** | Manual | Automatic |
| **CSRF Protection** | Manual | Built-in |
| **Maintenance** | High | Low |
| **Community** | None | Large |

---

## 📊 Architecture Comparison

### Current (Supabase)
```
User → Supabase OAuth → Session Cookie → Middleware → App
```

### New (NextAuth.js)
```
User → NextAuth.js → Google OAuth → Database Session → Middleware → App
```

**Key difference:** NextAuth.js stores sessions in your database (PostgreSQL)

---

## 🔄 4-Phase Migration Plan

### Phase 1: Setup & Configuration (Days 1-2)

#### 1.1 Install Dependencies
```bash
npm install next-auth@beta
npm install @auth/drizzle-adapter
npm install @auth/core
```

#### 1.2 Create NextAuth Configuration
Create `auth.ts` in project root:
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
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
  },
})
```

#### 1.3 Create API Route
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

#### 1.4 Update Environment Variables
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_min_32_chars
```

### Phase 2: Database Schema Updates (Days 2-3)

#### 2.1 Create NextAuth Tables
NextAuth.js requires specific tables. Create migration:
```sql
-- NextAuth.js tables
CREATE TABLE "accounts" (
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
  PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE "sessions" (
  "sessionToken" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "expires" timestamp NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "verification_tokens" (
  "email" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("email", "token")
);

-- Update users table
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp;
```

#### 2.2 Run Migration
```bash
npm run db:push
```

### Phase 3: Component & Utility Updates (Days 3-4)

#### 3.1 Update Auth Utilities
Replace `lib/auth-utils.ts`:
```typescript
import { auth } from "@/auth"
import { getDb } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user) return null
  
  const db = getDb()
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
  
  return user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}
```

#### 3.2 Update Middleware
Replace `middleware.ts`:
```typescript
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  // Public routes
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/auth")
  ) {
    return NextResponse.next()
  }
  
  // Protected routes
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

#### 3.3 Update Sign-In Button
Replace `components/google-sign-in-button.tsx`:
```typescript
"use client"

import { signIn } from "next-auth/react"

export default function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google", { redirectTo: "/dashboard" })}
      className="btn btn-primary"
    >
      Sign in with Google
    </button>
  )
}
```

#### 3.4 Update Logout Button
Replace `components/logout-button.tsx`:
```typescript
"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/auth/login" })}
      className="btn btn-ghost"
    >
      Logout
    </button>
  )
}
```

### Phase 4: Testing & Cleanup (Days 4-5)

#### 4.1 Test Authentication Flow
- [ ] Google sign-in works
- [ ] User created in database
- [ ] Session stored correctly
- [ ] Protected routes accessible
- [ ] Logout clears session
- [ ] Refresh token works

#### 4.2 Remove Supabase Dependencies
```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

#### 4.3 Remove Supabase Files
- Delete `packages/supabase/` (or refactor)
- Delete `supabase/config.toml`
- Delete `supabase/migrations/`
- Update `.env` files

#### 4.4 Update Documentation
- Update README
- Update deployment guides
- Document NextAuth.js setup

---

## 📦 Dependencies

### Install
```bash
npm install next-auth@beta @auth/drizzle-adapter @auth/core
```

### Remove
```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

---

## 🔐 Environment Variables

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Database (existing)
DATABASE_URL=postgresql://...
```

---

## 📁 Files to Create

```
auth.ts                              (NextAuth config)
app/api/auth/[...nextauth]/route.ts (API route)
```

---

## 📝 Files to Modify

```
middleware.ts                        (Update for NextAuth)
lib/auth-utils.ts                   (Update utilities)
components/google-sign-in-button.tsx (Update button)
components/logout-button.tsx         (Update button)
package.json                         (Update deps)
.env                                 (Update variables)
```

---

## ✅ Implementation Checklist

- [ ] Install NextAuth.js dependencies
- [ ] Create `auth.ts` configuration
- [ ] Create API route
- [ ] Create database migrations
- [ ] Update auth utilities
- [ ] Update middleware
- [ ] Update sign-in button
- [ ] Update logout button
- [ ] Test authentication flow
- [ ] Remove Supabase dependencies
- [ ] Deploy to production

---

## 🚀 Benefits

✅ **Faster Setup** - 2-3 days vs 2-3 weeks  
✅ **Battle-Tested** - Used by thousands of apps  
✅ **Multiple Providers** - Easy to add GitHub, Discord, etc.  
✅ **Better Maintenance** - Community support  
✅ **Type-Safe** - Full TypeScript support  
✅ **Database Agnostic** - Works with any database  

---

## ⚠️ Considerations

- NextAuth.js v5 is in beta (stable for production)
- Requires database for session storage
- Different session format than Supabase
- Need to handle user role mapping

---

## 📚 Resources

- [NextAuth.js Documentation](https://authjs.dev/)
- [Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Google Provider](https://authjs.dev/reference/providers/google)
- [Session Callbacks](https://authjs.dev/reference/nextjs#callbacks)

---

**Estimated Timeline:** 4-5 days  
**Risk Level:** Low  
**Recommendation:** Highly recommended! 🎉

