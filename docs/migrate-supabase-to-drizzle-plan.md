# Migrate Supabase Queries to Drizzle ORM

## Overview

Replace all direct `supabase.from()` queries with Drizzle ORM queries using `getDb()` from `@/db`. The Drizzle infrastructure is already set up with schema definitions in `db/schema.ts` and connection utilities in `db/index.ts`.

## Files Requiring Migration

Based on the codebase analysis, **12 files** contain direct Supabase queries that need migration:

### Client Components (Browser)

1. **`components/users/user-form.tsx`** - 2 queries (update/insert users)
2. **`components/users/address-list.tsx`** - 4 queries (fetch, delete, update addresses)
3. **`components/users/address-form.tsx`** - 4 queries (update/insert addresses)
4. **`components/projects/my-assignment-list.tsx`** - 5 queries (insert, update, delete, select project_assignments)
5. **`components/users/user-select.tsx`** - 1 query (select users)
6. **`components/users/extended-absence-list.tsx`** - 2 queries (select, delete extended_absences)
7. **`components/users/extended-absence-form.tsx`** - 2 queries (update/insert extended_absences)
8. **`components/projects/projects-view-page.tsx`** - 2 queries (select, update projects)
9. **`components/projects/project-form.tsx`** - 2 queries (update/insert projects)

### Server Components/Actions

10. **`components/users/user-view-page.tsx`** - 1 query (select users by id)
11. **`app/admin/users/[userId]/page.tsx`** - 2 queries (select users, select addresses)
12. **`app/admin/projects/[projectId]/assignments/actions.ts`** - 1 query (insert project_assignments)

## Migration Strategy

### Key Differences

**Supabase Query:**

```typescript
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .single();
```

**Drizzle Query:**

```typescript
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();
const [user] = await db.select().from(users).where(eq(users.id, userId));
```

### Client vs Server Considerations

**Client Components:**

- Currently use `createBrowserClient()` from `@workspace/supabase`
- **Challenge:** Drizzle with node-postgres cannot run in browser
- **Solution:** Create server actions for all database operations and call them from client components

**Server Components/Actions:**

- Can use `getDb()` directly
- Straightforward migration

## Implementation Plan

### Phase 1: Create Server Actions Infrastructure

Create centralized server actions for each table:

- `app/actions/users.ts` - User CRUD operations
- `app/actions/addresses.ts` - Address CRUD operations
- `app/actions/projects.ts` - Project CRUD operations
- `app/actions/project-assignments.ts` - Assignment CRUD operations
- `app/actions/extended-absences.ts` - Extended absence CRUD operations

### Phase 2: Migrate Server Components

Convert server-side queries in:

- `components/users/user-view-page.tsx`
- `app/admin/users/[userId]/page.tsx`
- `app/admin/projects/[projectId]/assignments/actions.ts`

### Phase 3: Migrate Client Components

Replace client-side Supabase queries with server action calls in:

- All user-related components
- All project-related components
- All address-related components
- All extended-absence components

### Phase 4: Update Imports

Ensure all migrated files import from:

- `@/db` for `getDb()`
- `@/db/schema` for table definitions
- `drizzle-orm` for query builders (`eq`, `and`, `or`, etc.)

### Phase 5: Testing & Cleanup

- Test all CRUD operations
- Remove unused Supabase client imports
- Verify RLS policies still work (if applicable)
- Update any error handling to match Drizzle patterns

## Files Summary

| File | Type | Queries | Tables Affected |
|------|------|---------|-----------------|
| `components/users/user-form.tsx` | Client | 2 | users |
| `components/users/address-list.tsx` | Client | 4 | addresses |
| `components/users/address-form.tsx` | Client | 4 | addresses |
| `components/projects/my-assignment-list.tsx` | Client | 5 | project_assignments |
| `components/users/user-select.tsx` | Client | 1 | users |
| `components/users/extended-absence-list.tsx` | Client | 2 | extended_absences |
| `components/users/extended-absence-form.tsx` | Client | 2 | extended_absences |
| `components/projects/projects-view-page.tsx` | Client | 2 | projects |
| `components/projects/project-form.tsx` | Client | 2 | projects |
| `components/users/user-view-page.tsx` | Server | 1 | users |
| `app/admin/users/[userId]/page.tsx` | Server | 2 | users, addresses |
| `app/admin/projects/[projectId]/assignments/actions.ts` | Server | 1 | project_assignments |

**Total: 28 queries across 12 files**

## Notes

- The Drizzle schema is already defined in `db/schema.ts` with all tables
- Connection pooling is properly configured in `db/index.ts`
- Migration tracking is set up and working
- No schema changes needed - only query syntax migration

## To-dos

- [ ] Create centralized server actions for database operations (users, addresses, projects, project_assignments, extended_absences)
- [ ] Migrate server components and actions to use Drizzle directly (3 files)
- [ ] Migrate user-related client components to use server actions (4 files: user-form, user-select, extended-absence-list, extended-absence-form)
- [ ] Migrate address-related client components to use server actions (2 files: address-list, address-form)
- [ ] Migrate project-related client components to use server actions (3 files: my-assignment-list, projects-view-page, project-form)
- [ ] Test all CRUD operations, remove unused Supabase imports, verify functionality

