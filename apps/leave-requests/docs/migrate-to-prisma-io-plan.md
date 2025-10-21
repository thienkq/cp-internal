# Migrate to Prisma.io Database (Keep Supabase Auth)

## Overview

Migrate application data to Prisma.io database while keeping Supabase Auth (hosted) for authentication. Gmail login continues working. Remove RLS policies from database and handle authorization in application code instead.

**Architecture After Migration:**

- **Authentication**: Supabase Auth (hosted) - handles Gmail OAuth, sessions, JWT
- **Database**: Prisma.io PostgreSQL - stores all application data
- **Authorization**: Application code (middleware, server actions)

## Phase 1: Update Schema (Remove RLS Only)

### 1.1 Update Drizzle Schema Definition

**File**: `apps/leave-requests/db/schema.ts`

**Remove**: All `pgPolicy()` definitions (~64 lines across 10 tables)

**Keep everything else**:

- All table structures and columnsß
- Foreign keys, indexes, constraints
- The `users` table structure (but we'll modify the foreign key approach)

Affected tables: `users`, `addresses`, `projects`, `project_assignments`, `leave_types`, `company_settings`, `leave_requests`, `extended_absences`, `bonus_leave_grants`, `signup_email_domains`

**Important for `users` table**:

- Remove `pgPolicy()` definitions
- Keep `id: uuid().primaryKey()` structure
- The ID will still come from Supabase Auth, but no database-level foreign key to `auth.users`

### 1.2 Generate Clean Migration

```bash
cd apps/leave-requests
pnpm db:generate
```

This creates migration file without RLS policies but keeps all tables/structure.

## Phase 2: Set Up Prisma.io Database

### 2.1 Create Environment Configuration

**File**: `apps/leave-requests/.env.local`

```bash
# Prisma.io Database - Your application data
DATABASE_URL=postgres://66914cb1dd9ffe30e425c42a16a98d8ecce3e6f1144dcfc40a311bf0ec27c085:sk_nV3cATeQ_3oywhP8h-sWG@db.prisma.io:5432/postgres?sslmode=require

# Supabase Auth - Keep these for authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note**: You'll need to create a Supabase project (free tier works) for auth only. No database needed from Supabase.

### 2.2 Test Connection to Prisma.io

```bash
cd apps/leave-requests
pnpm db:studio
```

Opens Drizzle Studio connected to Prisma.io to verify connection works.

### 2.3 Deploy Schema to Prisma.io

```bash
pnpm db:push
```

Creates all tables on Prisma.io database (without RLS policies).

### 2.4 Verify Deployment

Check in Drizzle Studio:

- All 10 tables created
- Indexes and constraints in place
- Foreign key relationships work

## Phase 3: Update Application Authorization

Since RLS is removed, add authorization checks in application code.

### 3.1 Create Authorization Helper

**File**: `apps/leave-requests/lib/auth-utils.ts` (new file)

```typescript
import { createServerClient } from "@workspace/supabase";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  // Query users table to get role
  const db = getDb();
  const [userRecord] = await db.select().from(users).where(eq(users.id, user.id));
  
  if (!userRecord || !allowedRoles.includes(userRecord.role)) {
    throw new Error("Forbidden");
  }
  
  return { user, userRecord };
}
```

### 3.2 Update Server Actions

**Files**: `app/actions/*.ts` (5 files: addresses.ts, extended-absences.ts, project-assignments.ts, projects.ts, users.ts)

Add authorization checks at the start of each action:

```typescript
import { requireAuth, requireRole } from "@/lib/auth-utils";

export async function createProject(data: ProjectData) {
  // Add this check
  await requireRole(["admin"]);
  
  // Existing code...
}

export async function updateOwnProfile(userId: string, data: ProfileData) {
  // Add this check
  const { user } = await requireAuth();
  if (user.id !== userId) {
    throw new Error("Can only update own profile");
  }
  
  // Existing code...
}
```

### 3.3 Update Middleware (Keep Auth Check)

**File**: `apps/leave-requests/middleware.ts`

Verify it's checking Supabase auth and redirecting to login if needed. Should already be working since we're keeping Supabase auth.

### 3.4 Keep User Sync Logic

**Important**: When users sign up via Supabase Auth, we need to create their profile in `users` table.

**Option A**: Create API route that Supabase webhook calls

**Option B**: Check and create user record on first login (recommended for now)

**File**: Update middleware or create helper that ensures user exists:

```typescript
// In middleware or auth helper
async function ensureUserExists(supabaseUser: User) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.id, supabaseUser.id));
  
  if (existing.length === 0) {
    await db.insert(users).values({
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: supabaseUser.user_metadata?.full_name || "",
      role: "employee",
    });
  }
}
```

## Phase 4: Keep Supabase Auth Components

### 4.1 No Changes Needed

These components continue working as-is:

- `components/google-sign-in-button.tsx`
- `components/auth-button.tsx`
- `components/login-form.tsx`
- `components/logout-button.tsx`
- `components/providers.tsx`
- `middleware.ts`

They all use `@workspace/supabase` which connects to Supabase Auth.

### 4.2 Keep Supabase Package

**File**: `apps/leave-requests/package.json`

Keep dependency:

```json
{
  "dependencies": {
    "@workspace/supabase": "workspace:*"
  }
}
```

## Phase 5: Handle Email Domain Restrictions

Since we're removing the Supabase auth hook `hook_restrict_signup_by_email_domain()`, we need to handle email validation differently.

### 5.1 Option A: Supabase Edge Function (Recommended)

Create a Supabase Edge Function that validates email domains during signup. This keeps the validation at auth time.

### 5.2 Option B: Post-Signup Validation

Allow signup, then check email domain and disable account if not allowed. Add check in middleware.

### 5.3 Option C: Remove for Now

Comment in code that email domain validation needs to be re-implemented. Handle manually for now.

**Recommendation**: Go with Option C for this migration, implement proper solution later.

## Phase 6: Testing

### 6.1 Test Authentication Flow

1. Access login page
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirected to dashboard
5. Check user record created in Prisma.io `users` table

### 6.2 Test Authorization

1. As regular user: Try accessing admin pages (should be blocked)
2. As admin: Access admin pages (should work)
3. Test creating leave requests, projects, etc.

### 6.3 Test Data Operations

- Create/edit users
- Create leave requests
- Manage projects
- All CRUD operations should work with Prisma.io database

## Phase 7: Documentation

### 7.1 Update Database Migration Guide

**File**: `apps/leave-requests/docs/DATABASE_MIGRATION_GUIDE.md`

Document:

- **Database**: Now on Prisma.io
- **Auth**: Still uses Supabase (hosted)
- **RLS Removed**: Authorization now in app code
- **Email validation**: Needs reimplementation

### 7.2 Update README

**File**: `apps/leave-requests/README.md`

Update setup section:

- **Database setup**: Point to Prisma.io
- **Auth setup**: Keep Supabase Auth setup (create project, get keys)
- **Local development**: No Supabase local needed, just env vars

Example:

```markdown
### 3. Set up Supabase Auth (Authentication only)
1. Create free Supabase project at supabase.com
2. Enable Google OAuth provider
3. Get your project URL and anon key

### 4. Configure Environment
Create `.env.local`:
DATABASE_URL=postgres://...prisma.io...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

### 5. Deploy Database Schema
pnpm db:push

### 6. Start Development
pnpm dev
```

## Phase 8: Optional - Seed Data

### 8.1 Create Seed Script

**File**: `apps/leave-requests/scripts/seed-prisma.ts`

Create initial data:

- Leave types (Annual, Sick, etc.)
- Company settings
- Optional: Test users (must have valid Supabase Auth user IDs)

## Key Changes Summary

**Modified Files**:

- `apps/leave-requests/db/schema.ts` - Remove pgPolicy definitions
- `apps/leave-requests/.env.local` - Add Prisma.io DATABASE_URL, keep Supabase auth vars
- `apps/leave-requests/lib/auth-utils.ts` - NEW: Authorization helpers
- `apps/leave-requests/app/actions/*.ts` - Add authorization checks (5 files)
- `apps/leave-requests/middleware.ts` - Add user sync logic
- `apps/leave-requests/docs/DATABASE_MIGRATION_GUIDE.md` - Document changes
- `apps/leave-requests/README.md` - Update setup instructions

**What Stays**:

- All auth components (`@workspace/supabase`, login forms, etc.)
- Supabase Auth integration
- Gmail OAuth login
- User sessions and JWT handling

**What's Removed**:

- RLS policies from database schema
- Dependency on `auth.users` table
- Supabase auth hooks (email domain validation)

**What's New**:

- Database on Prisma.io
- Authorization checks in application code
- User sync logic (Supabase Auth → Prisma.io users table)

## Migration Benefits

1. ✅ **Gmail login keeps working** - No disruption to users
2. ✅ **Database on Prisma.io** - Your data, your control
3. ✅ **Simpler local dev** - No Supabase local, just env vars
4. ✅ **Can switch auth later** - Database not tied to auth system
5. ✅ **More control** - Authorization in code vs database policies

## Future Work (Not in This Plan)

1. Re-implement email domain validation (Supabase Edge Function or app logic)
2. Consider switching to NextAuth/Clerk (optional)
3. Add more granular authorization checks
4. Implement audit logging for admin actions