# Action Plan: Migrate from Supabase OAuth to Self-Coded Google Login

## 📋 Overview

This document outlines the migration from **Supabase-managed Google OAuth** to **self-implemented Google OAuth** (similar to Firebase approach), while keeping the PostgreSQL database and Drizzle ORM intact.

---

## 🗄️ Database Dependencies with Supabase

### Current Setup
- **Database**: PostgreSQL (direct connection via `DATABASE_URL`)
- **ORM**: Drizzle ORM (NOT Supabase ORM)
- **Auth**: Supabase Auth (manages sessions via cookies)
- **Connection**: Direct PostgreSQL connection pool (pg library)

### Key Tables
```
users (id, email, full_name, role, ...)
├── id: UUID (currently from Supabase auth.users)
├── email: text (unique)
├── role: text (employee, manager, admin)
└── created_at, updated_at

sessions (custom - needs to be created)
├── id: UUID
├── user_id: UUID (FK to users)
├── token: text (JWT)
├── expires_at: timestamp
└── created_at
```

### Important Note
**Your database is NOT dependent on Supabase!** You're using:
- Direct PostgreSQL connection
- Drizzle ORM for queries
- Custom user table (not Supabase's auth.users)

This makes migration much easier! ✅

---

## 🔄 Migration Strategy

### Phase 1: Setup Google OAuth Infrastructure
1. **Create Google OAuth Credentials**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URI: `http://localhost:3000/auth/google/callback`
   - Get Client ID and Client Secret

2. **Add Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   JWT_SECRET=your_jwt_secret_for_signing_tokens
   ```

3. **Install Dependencies**
   ```bash
   npm install google-auth-library jsonwebtoken
   # or
   pnpm add google-auth-library jsonwebtoken
   ```

### Phase 2: Create Session Management
1. **Create Sessions Table**
   ```sql
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     token TEXT NOT NULL UNIQUE,
     refresh_token TEXT,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Add Session Utilities** (`lib/session-utils.ts`)
   - `createSession()` - Create JWT token
   - `verifySession()` - Verify JWT token
   - `refreshSession()` - Refresh expired token
   - `deleteSession()` - Logout

### Phase 3: Implement Google OAuth Flow
1. **Create OAuth Handler** (`app/api/auth/google/route.ts`)
   - Exchange authorization code for tokens
   - Fetch user info from Google
   - Create/update user in database
   - Create session token
   - Set secure HTTP-only cookie

2. **Create Callback Route** (`app/auth/google/callback/route.ts`)
   - Handle Google redirect
   - Exchange code for tokens
   - Redirect to dashboard

3. **Create Sign-In Button** (replace current)
   - Redirect to Google OAuth endpoint
   - Include state parameter for CSRF protection

### Phase 4: Update Authentication Utilities
1. **Modify `@workspace/supabase` package**
   - Remove Supabase auth dependencies
   - Add custom JWT verification
   - Update `getUser()` to read from JWT cookie
   - Update `requireAuth()` to verify JWT

2. **Update Middleware** (`middleware.ts`)
   - Replace `updateSession()` with custom JWT validation
   - Verify JWT from cookies
   - Redirect if invalid/expired

### Phase 5: Update Components
1. **Replace GoogleSignInButton**
   - Point to `/api/auth/google` instead of Supabase OAuth

2. **Update LoginForm**
   - Keep email/password logic (if using)
   - Or remove if only Google login

3. **Update LogoutButton**
   - Call `/api/auth/logout` instead of Supabase

### Phase 6: Remove Supabase Auth
1. **Remove Dependencies**
   - Remove `@supabase/supabase-js`
   - Remove `@supabase/ssr`
   - Keep `@workspace/supabase` package but refactor

2. **Remove Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_AUTH_GOOGLE_CLIENT_ID`
   - `SUPABASE_AUTH_GOOGLE_SECRET`

3. **Remove Supabase Config**
   - Delete `supabase/config.toml`
   - Delete `supabase/migrations/` (keep database schema)

---

## 📊 Implementation Checklist

### Week 1: Setup & Infrastructure
- [ ] Create Google OAuth credentials
- [ ] Add environment variables
- [ ] Install dependencies (google-auth-library, jsonwebtoken)
- [ ] Create sessions table migration
- [ ] Create session utilities

### Week 2: OAuth Implementation
- [ ] Create Google OAuth API route
- [ ] Create callback handler
- [ ] Implement JWT token generation
- [ ] Add CSRF protection (state parameter)
- [ ] Test OAuth flow locally

### Week 3: Integration & Migration
- [ ] Update authentication utilities
- [ ] Update middleware for JWT validation
- [ ] Replace GoogleSignInButton component
- [ ] Update LogoutButton
- [ ] Update auth-utils.ts in app

### Week 4: Testing & Cleanup
- [ ] Test complete auth flow
- [ ] Test session refresh
- [ ] Test logout
- [ ] Remove Supabase dependencies
- [ ] Update documentation
- [ ] Deploy to production

---

## 🔐 Security Considerations

1. **JWT Secrets**: Store in environment variables, never commit
2. **CSRF Protection**: Use state parameter in OAuth flow
3. **HTTP-Only Cookies**: Store JWT in secure, HTTP-only cookies
4. **Token Expiry**: Implement short-lived access tokens (1 hour)
5. **Refresh Tokens**: Implement refresh token rotation
6. **HTTPS**: Use HTTPS in production
7. **Rate Limiting**: Add rate limiting to auth endpoints

---

## 📝 Key Files to Create/Modify

### New Files
- `lib/session-utils.ts` - Session management
- `lib/jwt-utils.ts` - JWT token handling
- `app/api/auth/google/route.ts` - OAuth handler
- `app/auth/google/callback/route.ts` - Callback handler
- `app/api/auth/logout/route.ts` - Logout endpoint
- `drizzle/migrations/[timestamp]_create_sessions_table.sql`

### Modified Files
- `packages/supabase/src/auth.ts` - Update auth utilities
- `packages/supabase/src/middleware.ts` - Update middleware
- `middleware.ts` - Update middleware config
- `components/google-sign-in-button.tsx` - Update button
- `components/logout-button.tsx` - Update logout
- `lib/auth-utils.ts` - Update app-specific auth

### Removed Files
- `supabase/config.toml`
- `supabase/migrations/` (keep schema, remove Supabase-specific)

---

## 🚀 Benefits of This Approach

✅ **Full Control**: Complete control over auth flow  
✅ **No Supabase Auth Dependency**: Simpler architecture  
✅ **Database Agnostic**: Can migrate database later if needed  
✅ **Cost Savings**: No Supabase auth tier costs  
✅ **Flexibility**: Easy to add other OAuth providers  
✅ **Firebase-like**: Similar to Firebase Google login  

---

## ⚠️ Considerations

- **Maintenance**: You're responsible for auth security
- **Testing**: Comprehensive testing required
- **Monitoring**: Need to monitor auth failures
- **Compliance**: Ensure GDPR/privacy compliance
- **Backup Plan**: Keep Supabase running during migration

---

## 📚 References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

