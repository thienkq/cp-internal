# Database Dependencies Analysis: Supabase vs Direct PostgreSQL

## 📊 Current Architecture

### What You're Using
```
┌─────────────────────────────────────────┐
│  Leave Requests App (Next.js)           │
├─────────────────────────────────────────┤
│  Layer 1: Authentication                │
│  ├─ Supabase Auth (OAuth, Sessions)     │
│  └─ @workspace/supabase package         │
├─────────────────────────────────────────┤
│  Layer 2: Database Access               │
│  ├─ Drizzle ORM                         │
│  ├─ Direct PostgreSQL Connection        │
│  └─ Connection Pool (pg library)        │
├─────────────────────────────────────────┤
│  Layer 3: Database                      │
│  └─ PostgreSQL (Direct, NOT Supabase)   │
└─────────────────────────────────────────┘
```

### Key Finding: **NO Supabase Database Dependency!**

Your app uses:
- ✅ **Direct PostgreSQL connection** via `DATABASE_URL`
- ✅ **Drizzle ORM** for queries (not Supabase ORM)
- ✅ **pg library** for connection pooling
- ❌ **NOT** using Supabase's PostgREST API
- ❌ **NOT** using Supabase's Realtime
- ❌ **NOT** using Supabase's Storage

---

## 🔍 Detailed Dependency Breakdown

### 1. Authentication Layer (Supabase Dependent)
```
@workspace/supabase package
├── @supabase/supabase-js (Auth client)
├── @supabase/ssr (Session management)
└── Manages: OAuth, Sessions, User validation
```

**What it does:**
- Handles Google OAuth flow
- Manages session cookies
- Validates user authentication
- Provides `getUser()`, `requireAuth()` utilities

**Can be replaced with:** Custom JWT-based auth ✅

### 2. Database Layer (PostgreSQL Direct)
```
apps/leave-requests
├── db/index.ts
│   ├── Creates connection pool (pg library)
│   ├── Initializes Drizzle ORM
│   └── Exports getDb() function
├── db/schema.ts
│   ├── Defines all tables (Drizzle schema)
│   └── No Supabase-specific code
└── drizzle.config.ts
    └── Configured for PostgreSQL (not Supabase)
```

**What it does:**
- Direct PostgreSQL connection
- Drizzle ORM for type-safe queries
- Connection pooling (min 5, max 20)

**Supabase dependency:** NONE ✅

### 3. Database Tables

#### Users Table
```typescript
export const users = pgTable('users', {
  id: uuid().primaryKey(),           // From Supabase auth.users
  email: text(),
  full_name: text(),
  role: text().default('employee'),
  // ... other fields
});
```

**Current**: `id` comes from Supabase auth.users  
**After migration**: `id` will be Google's `sub` claim

#### Sessions Table (To be created)
```typescript
export const sessions = pgTable('sessions', {
  id: uuid().primaryKey(),
  user_id: uuid().references(users.id),
  token: text(),                     // JWT token
  refresh_token: text(),
  expires_at: timestamp(),
  created_at: timestamp(),
});
```

#### Other Tables (No Supabase dependency)
- addresses
- projects
- project_assignments
- company_settings
- leave_types
- leave_requests
- extended_absences
- bonus_leave_grants
- signup_email_domains

All these tables are **completely independent** of Supabase! ✅

---

## 🔄 Data Flow Comparison

### Current Flow (Supabase Auth)
```
1. User clicks "Sign in with Google"
   ↓
2. Supabase OAuth handler
   ↓
3. Google OAuth flow
   ↓
4. Supabase creates session cookie
   ↓
5. App reads cookie via @supabase/ssr
   ↓
6. Middleware validates via Supabase
   ↓
7. Access PostgreSQL via Drizzle ORM
```

### New Flow (Self-Coded OAuth)
```
1. User clicks "Sign in with Google"
   ↓
2. Custom OAuth handler (/api/auth/google)
   ↓
3. Google OAuth flow
   ↓
4. Create JWT token + session record
   ↓
5. Set JWT in HTTP-only cookie
   ↓
6. Middleware validates JWT
   ↓
7. Access PostgreSQL via Drizzle ORM (same)
```

---

## 📦 Dependency Tree

### Current
```
@workspace/supabase
├── @supabase/supabase-js
├── @supabase/ssr
└── next (peer)

apps/leave-requests
├── @workspace/supabase
├── drizzle-orm
├── pg (PostgreSQL driver)
└── next
```

### After Migration
```
@workspace/supabase (refactored)
├── jsonwebtoken
├── google-auth-library
└── next (peer)

apps/leave-requests
├── @workspace/supabase (refactored)
├── drizzle-orm
├── pg (PostgreSQL driver)
├── jsonwebtoken
├── google-auth-library
└── next
```

**Removed:**
- @supabase/supabase-js
- @supabase/ssr

**Added:**
- jsonwebtoken
- google-auth-library

---

## 🎯 Migration Impact Analysis

### Zero Impact (No Changes Needed)
- ✅ Database schema (all tables)
- ✅ Drizzle ORM queries
- ✅ PostgreSQL connection
- ✅ Database migrations
- ✅ All business logic queries

### Moderate Impact (Refactoring Needed)
- 🔄 Authentication utilities
- 🔄 Middleware
- 🔄 Auth components
- 🔄 @workspace/supabase package

### High Impact (Complete Rewrite)
- 🔴 Google OAuth flow
- 🔴 Session management
- 🔴 Auth callbacks

---

## 💾 Data Preservation

### What Stays the Same
- All user data in `users` table
- All leave requests
- All historical data
- Database structure

### What Changes
- User `id` field (from Supabase UUID to Google `sub`)
- Session storage (from Supabase to custom table)
- Session format (from Supabase cookie to JWT)

### Migration Strategy
1. Keep existing users table
2. Create new sessions table
3. Migrate existing users to new auth system
4. Update user IDs if needed (or use mapping table)

---

## 🔐 Security Implications

### Current (Supabase)
- Supabase manages auth security
- Supabase handles token refresh
- Supabase manages session expiry

### New (Self-Coded)
- You manage auth security
- You implement token refresh
- You manage session expiry
- **Requires:** Proper JWT handling, HTTPS, secure cookies

---

## 📈 Scalability

### Current
- Supabase handles auth scaling
- PostgreSQL direct connection (20 max connections)

### New
- You handle auth scaling
- Same PostgreSQL connection pool
- JWT is stateless (scales better)
- Sessions table grows over time (needs cleanup)

---

## 🚀 Recommendation

**Proceed with migration!** Your architecture is well-suited:

✅ Database is independent of Supabase  
✅ Using Drizzle ORM (not Supabase ORM)  
✅ Direct PostgreSQL connection  
✅ Clean separation of concerns  
✅ Easy to replace auth layer  

**Estimated effort:** 2-3 weeks  
**Risk level:** Low (database unaffected)  
**Rollback plan:** Keep Supabase running during migration

