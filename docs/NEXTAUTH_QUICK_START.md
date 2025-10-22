# NextAuth.js Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install (1 minute)
```bash
cd apps/leave-requests
npm install next-auth@beta @auth/drizzle-adapter @auth/core
```

### Step 2: Create auth.ts (2 minutes)
Create `apps/leave-requests/auth.ts`:
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
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
```

### Step 3: Create API Route (1 minute)
Create `apps/leave-requests/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Step 4: Update .env (1 minute)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_min_32_chars
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## 🗄️ Database Setup (5 minutes)

### Create Migration
Create `drizzle/migrations/[timestamp]_add_nextauth_tables.sql`:
```sql
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

CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionToken" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "expires" timestamp NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "email" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("email", "token")
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" timestamp;

CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
```

### Run Migration
```bash
npm run db:push
```

---

## 🔄 Update Components (10 minutes)

### Update middleware.ts
```typescript
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

### Update lib/auth-utils.ts
```typescript
import { auth } from "@/auth"
import { getDb } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id))
  return user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
```

### Update components/google-sign-in-button.tsx
```typescript
"use client"
import { signIn } from "next-auth/react"

export default function GoogleSignInButton() {
  return (
    <button onClick={() => signIn("google", { redirectTo: "/dashboard" })}>
      Sign in with Google
    </button>
  )
}
```

### Update components/logout-button.tsx
```typescript
"use client"
import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button onClick={() => signOut({ redirectTo: "/auth/login" })}>
      Logout
    </button>
  )
}
```

---

## ✅ Testing (5 minutes)

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Test sign-in**
   - Go to http://localhost:3000/auth/login
   - Click "Sign in with Google"
   - Verify redirect to Google
   - Verify callback works

3. **Check database**
   ```bash
   npm run db:studio
   ```
   - Verify user in `users` table
   - Verify session in `sessions` table
   - Verify account in `accounts` table

4. **Test protected routes**
   - Try accessing /dashboard
   - Should work after sign-in
   - Should redirect to login if not signed in

5. **Test logout**
   - Click logout
   - Should redirect to login
   - Session should be cleared

---

## 🧹 Cleanup (5 minutes)

### Remove Supabase
```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

### Remove Supabase Files
```bash
rm -rf packages/supabase
rm apps/leave-requests/supabase/config.toml
```

### Update .env
Remove:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_AUTH_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_GOOGLE_SECRET=...
```

---

## 🚀 Deploy (5 minutes)

### Vercel
1. Add environment variables in Vercel dashboard
2. Deploy normally
3. Done!

### Self-Hosted
1. Set `NEXTAUTH_URL` to your domain
2. Generate strong `NEXTAUTH_SECRET`
3. Deploy
4. Done!

---

## 📊 Total Time: ~30 minutes

| Task | Time |
|------|------|
| Install | 1 min |
| Create auth.ts | 2 min |
| Create API route | 1 min |
| Update .env | 1 min |
| Database setup | 5 min |
| Update components | 10 min |
| Testing | 5 min |
| Cleanup | 5 min |
| **Total** | **~30 min** |

---

## 🎯 What You Get

✅ Google OAuth working  
✅ Sessions in your database  
✅ Protected routes  
✅ User sign-in/sign-out  
✅ Type-safe authentication  
✅ Zero cost  
✅ Battle-tested security  

---

## 🆘 Troubleshooting

### "NEXTAUTH_SECRET is not set"
```bash
# Generate and add to .env
openssl rand -base64 32
```

### "Google OAuth not working"
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Verify redirect URI in Google Console
- Check `NEXTAUTH_URL` matches your domain

### "Database tables not created"
```bash
npm run db:push
npm run db:studio  # Verify tables exist
```

### "Session not persisting"
- Check `sessions` table in database
- Verify cookies are set (check browser DevTools)
- Check middleware is running

---

## 📚 Next Steps

1. Read [NEXTAUTH_TECHNICAL_GUIDE.md](./NEXTAUTH_TECHNICAL_GUIDE.md) for advanced setup
2. Read [NEXTAUTH_MIGRATION_PLAN.md](./NEXTAUTH_MIGRATION_PLAN.md) for detailed plan
3. Check [NextAuth.js Docs](https://authjs.dev/) for more features

---

## 💡 Pro Tips

1. **Add more providers easily**
   ```typescript
   import GitHub from "next-auth/providers/github"
   
   providers: [
     Google({ ... }),
     GitHub({ ... }),
   ]
   ```

2. **Add email/password auth**
   ```typescript
   import Credentials from "next-auth/providers/credentials"
   
   providers: [
     Credentials({
       credentials: {
         email: { label: "Email", type: "email" },
         password: { label: "Password", type: "password" }
       },
       async authorize(credentials) {
         // Verify credentials against database
       }
     })
   ]
   ```

3. **Customize session**
   ```typescript
   callbacks: {
     async session({ session, user }) {
       session.user.role = user.role
       session.user.id = user.id
       return session
     }
   }
   ```

---

**Ready? Start with Step 1!** 🚀

