# Migration Summary: Supabase OAuth → Self-Coded Google Login

## 🎯 Quick Overview

You want to migrate from **Supabase-managed Google OAuth** to **self-implemented Google OAuth** (like Firebase).

**Good news:** Your database is **NOT dependent on Supabase!** ✅

---

## 📊 Database Dependencies

### Current Setup
```
Supabase Auth (OAuth, Sessions)
        ↓
PostgreSQL (Direct Connection)
        ↓
Drizzle ORM (Type-safe queries)
```

### Key Facts
- ✅ Using **direct PostgreSQL connection** (not Supabase API)
- ✅ Using **Drizzle ORM** (not Supabase ORM)
- ✅ Using **pg library** for connection pooling
- ❌ NOT using Supabase PostgREST, Realtime, or Storage
- ❌ Database is **completely independent** of Supabase Auth

### What This Means
**You can safely remove Supabase Auth without affecting your database!**

---

## 🔄 What Needs to Change

### 1. Authentication Layer (MUST CHANGE)
- Remove Supabase OAuth
- Implement custom Google OAuth
- Replace session management
- Update middleware

### 2. Database Layer (NO CHANGE)
- Keep PostgreSQL connection
- Keep Drizzle ORM
- Keep all tables and queries
- Keep all business logic

### 3. New Components Needed
- JWT token generation/verification
- Custom session table
- Google OAuth API routes
- Custom session management utilities

---

## 📋 Action Plan (4 Phases)

### Phase 1: Setup (Week 1)
1. Create Google OAuth credentials
2. Add environment variables
3. Install dependencies: `google-auth-library`, `jsonwebtoken`
4. Create sessions table in database

### Phase 2: Implementation (Week 2)
1. Create session utilities (JWT handling)
2. Create Google OAuth API route
3. Create callback handler
4. Implement CSRF protection

### Phase 3: Integration (Week 3)
1. Update authentication utilities
2. Update middleware for JWT validation
3. Replace GoogleSignInButton component
4. Update LogoutButton
5. Update auth-utils.ts

### Phase 4: Testing & Cleanup (Week 4)
1. Test complete auth flow
2. Test session refresh
3. Test logout
4. Remove Supabase dependencies
5. Deploy to production

---

## 🔐 Key Differences

### Supabase OAuth
```
User → Google → Supabase → Session Cookie → App
```
- Supabase manages everything
- Session stored in Supabase
- You just call `supabase.auth.signInWithOAuth()`

### Self-Coded OAuth
```
User → Google → Your API → JWT Token → App
```
- You handle OAuth flow
- Session stored in your database
- You manage token refresh and expiry

---

## 📦 Dependencies

### Remove
- `@supabase/supabase-js`
- `@supabase/ssr`

### Add
- `google-auth-library` (Google OAuth)
- `jsonwebtoken` (JWT handling)

### Keep
- `drizzle-orm` (database queries)
- `pg` (PostgreSQL driver)
- All other dependencies

---

## 🗄️ Database Changes

### New Table: Sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Existing Tables
- No changes needed
- All data preserved
- All queries work the same

---

## 📁 Files to Create

```
lib/
├── session-utils.ts          (JWT handling)
├── jwt-utils.ts              (Token generation)
└── oauth-utils.ts            (OAuth helpers)

app/api/auth/
├── google/route.ts           (OAuth handler)
└── logout/route.ts           (Logout endpoint)

app/auth/google/
└── callback/route.ts         (OAuth callback)

drizzle/migrations/
└── [timestamp]_sessions.sql  (Sessions table)
```

---

## 🔄 Files to Modify

```
packages/supabase/src/
├── auth.ts                   (Update auth utilities)
├── middleware.ts             (Update JWT validation)
└── index.ts                  (Update exports)

apps/leave-requests/
├── middleware.ts             (Update middleware)
├── lib/auth-utils.ts         (Update app auth)
├── components/
│   ├── google-sign-in-button.tsx
│   └── logout-button.tsx
└── .env                      (Update variables)
```

---

## 🚀 Benefits

✅ **Full Control** - Complete control over auth flow  
✅ **Cost Savings** - No Supabase auth tier  
✅ **Flexibility** - Easy to add other OAuth providers  
✅ **Database Independent** - Can migrate DB later  
✅ **Firebase-like** - Similar to Firebase approach  
✅ **Simpler Architecture** - One less service to manage  

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Auth bugs | Comprehensive testing, security review |
| Token leaks | HTTP-only cookies, HTTPS only |
| Session management | Proper expiry, refresh token rotation |
| CSRF attacks | State parameter, SameSite cookies |
| Maintenance burden | Good documentation, monitoring |

---

## 📚 Documentation Created

1. **AUTHENTICATION_REVIEW.md** - Current auth architecture
2. **GOOGLE_OAUTH_MIGRATION_PLAN.md** - Detailed migration plan
3. **GOOGLE_OAUTH_TECHNICAL_DETAILS.md** - Code examples
4. **DATABASE_DEPENDENCIES_ANALYSIS.md** - Database analysis
5. **MIGRATION_SUMMARY.md** - This document

---

## ✅ Next Steps

1. **Review** the migration plan documents
2. **Create** Google OAuth credentials
3. **Set up** development environment
4. **Implement** Phase 1 (setup)
5. **Test** thoroughly before production

---

## 📞 Questions to Consider

- Do you want to keep email/password login?
- Do you need multiple OAuth providers?
- What's your session timeout preference?
- Do you need refresh token rotation?
- How will you handle existing users?

---

## 🎓 Learning Resources

- [Google OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2/web-server-flow)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

---

**Status:** Ready to proceed with migration ✅  
**Estimated Timeline:** 2-3 weeks  
**Risk Level:** Low (database unaffected)  
**Recommendation:** Proceed with confidence!

