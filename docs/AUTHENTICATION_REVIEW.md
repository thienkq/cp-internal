# Authentication Flow & Supabase Dependencies Review

## Overview
The leave-requests app uses **Supabase Auth** for user authentication with a centralized `@workspace/supabase` package that provides client/server utilities, middleware integration, and authentication helpers.

---

## 📦 Dependencies

### Core Supabase Packages
Located in `packages/supabase/package.json`:
```json
{
  "@supabase/supabase-js": "latest",
  "@supabase/ssr": "latest"
}
```

**Key Libraries:**
- **@supabase/supabase-js**: Main Supabase JavaScript client
- **@supabase/ssr**: Server-Side Rendering utilities for Next.js (handles cookie management)

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_AUTH_GOOGLE_CLIENT_ID=42505130049-...
SUPABASE_AUTH_GOOGLE_SECRET=GOCSPX-...
```

---

## 🔐 Authentication Architecture

### 1. **Centralized Supabase Package** (`packages/supabase/`)

#### Client Creation Functions
- **`createBrowserClient()`** - Browser-side Supabase client
  - Used in client components for auth operations
  - No cookie handling needed (browser manages cookies)
  
- **`createServerClient()`** - Server-side Supabase client
  - Used in server components, API routes, middleware
  - Handles cookie management via Next.js `cookies()` API
  - Properly syncs cookies between request/response

#### Authentication Utilities
- **`getUser()`** - Returns current authenticated user (or null)
- **`getCurrentUser()`** - Returns user + supabase client instance
- **`requireAuth()`** - Throws error if user not authenticated
- **`updateSession()`** - Middleware function to refresh session

### 2. **Middleware Integration** (`apps/leave-requests/middleware.ts`)

```typescript
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return response;
}
```

**What it does:**
- Runs on every request (except static files, images)
- Calls `supabase.auth.getUser()` to validate session
- Redirects unauthenticated users to `/auth/login`
- Maintains session cookies across requests
- **Important**: Database operations NOT performed here (Edge Runtime limitation)

---

## 🔄 Authentication Flows

### Flow 1: Email/Password Login
1. User visits `/auth/login`
2. `LoginForm` component (client-side) collects credentials
3. Calls `supabase.auth.signInWithPassword()`
4. On success → redirects to `/dashboard`
5. Session cookie automatically set by browser

### Flow 2: Google OAuth
1. User clicks "Sign in with Google"
2. `GoogleSignInButton` calls `supabase.auth.signInWithOAuth(provider: 'google')`
3. Redirects to Google login
4. Google redirects back to `/auth/callback?code=...`
5. Callback route exchanges code for session:
   ```typescript
   const { error } = await supabase.auth.exchangeCodeForSession(code)
   ```
6. Session established → redirects to `/dashboard`

### Flow 3: Sign Up
1. User visits `/auth/sign-up`
2. `SignUpForm` collects email, password
3. Calls `supabase.auth.signUp()`
4. Email confirmation required (if enabled)
5. Redirects to home page

### Flow 4: Protected Routes
1. Request arrives at middleware
2. `updateSession()` validates session via `auth.getUser()`
3. If authenticated → allow request
4. If not authenticated → redirect to `/auth/login`
5. Server components can call `getUser()` or `requireAuth()`

### Flow 5: Logout
1. User clicks logout button
2. `LogoutButton` calls `supabase.auth.signOut()`
3. Session cleared
4. Redirects to `/auth/login`

---

## 🔗 Key Integration Points

### Server Components
```typescript
import { getUser, requireAuth } from "@workspace/supabase";

// Get user (may be null)
const user = await getUser();

// Require authentication (throws if not authenticated)
const { user, supabase } = await requireAuth();
```

### Client Components
```typescript
import { createBrowserClient } from "@workspace/supabase";

const supabase = createBrowserClient();
await supabase.auth.signInWithPassword({ email, password });
```

### Local Auth Utils
`apps/leave-requests/lib/auth-utils.ts` provides app-specific helpers:
- `getCurrentUser()` - Get Supabase user
- `requireAuth()` - Enforce authentication
- `requireRole()` - Check user role from database
- `ensureUserExists()` - Sync Supabase user to local database

---

## ⚙️ Supabase Configuration

### Google OAuth Setup
`apps/leave-requests/supabase/config.toml`:
```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GOOGLE_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

### Auth Hooks
- **`hook_restrict_signup_by_email_domain`** - Restricts signups to specific email domains
- Enabled in config: `[auth.hook.before_user_created]`

---

## ⚠️ Important Notes

1. **Cookie Management**: The `@supabase/ssr` package handles cookie sync between request/response in middleware and server components
2. **Edge Runtime Limitation**: Middleware cannot perform database operations (use server components/actions instead)
3. **Session Persistence**: Sessions stored in cookies, automatically managed by Supabase
4. **User Sync**: New users from OAuth are synced to local database via `ensureUserExists()` in server components
5. **Role-Based Access**: User roles stored in local database, not Supabase auth metadata

---

## 📋 Dependency Tree

```
@workspace/supabase (packages/supabase/)
├── @supabase/supabase-js
├── @supabase/ssr
└── next (peer dependency)

apps/leave-requests
├── @workspace/supabase
├── drizzle-orm (local database)
├── next
└── react
```

---

## 🚀 Best Practices Observed

✅ Centralized auth package for code reuse  
✅ Proper SSR cookie handling via @supabase/ssr  
✅ Middleware for session validation  
✅ Separate client/server client creation  
✅ Error handling in auth forms  
✅ Google OAuth integration  
✅ User sync to local database  
✅ Role-based access control  

---

## 🔍 Potential Improvements

1. **Error Handling**: Add more specific error messages for auth failures
2. **Session Refresh**: Consider explicit session refresh logic
3. **Rate Limiting**: Add rate limiting to auth endpoints
4. **2FA Support**: Consider adding two-factor authentication
5. **Password Reset**: Implement password reset flow
6. **Email Verification**: Ensure email verification is enforced
7. **Audit Logging**: Log authentication events for security

