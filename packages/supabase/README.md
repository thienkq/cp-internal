# Authentication Utilities

The authentication utilities are now available in the workspace package `@workspace/supabase` and can be used across all apps in the monorepo.

## Available Functions

### `getCurrentUser()`
Gets the current authenticated user and Supabase client.

**Returns:** `Promise<{ user: User | null, supabase: SupabaseClient }>`

**Use case:** When you need both the user and the Supabase client for database operations.

```typescript
import { getCurrentUser } from "@workspace/supabase";

export default async function MyComponent() {
  const { user, supabase } = await getCurrentUser();
  
  if (user) {
    // User is authenticated
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id);
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <div>Please sign in</div>;
}
```

### `getUser()`
Gets the current authenticated user (without the Supabase client).

**Returns:** `Promise<User | null>`

**Use case:** When you only need the user information, not database access.

```typescript
import { getUser } from "@workspace/supabase";

export default async function MyComponent() {
  const user = await getUser();
  
  if (user) {
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <div>Please sign in</div>;
}
```

### `requireAuth(redirectTo?)`
Requires authentication and throws an error if user is not authenticated.

**Parameters:**
- `redirectTo` (optional): Path to redirect to if not authenticated (default: '/auth/login')

**Returns:** `Promise<{ user: User, supabase: SupabaseClient }>`

**Throws:** `Error` if user is not authenticated

**Use case:** For protected pages or API routes where authentication is required.

```typescript
import { requireAuth } from "@workspace/supabase";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  try {
    const { user, supabase } = await requireAuth();
    // User is guaranteed to be authenticated here
    return <div>Protected content for {user.email}</div>;
  } catch (error) {
    // Handle authentication error
    redirect('/auth/login');
  }
}
```

## Benefits

1. **Workspace-wide DRY Principle:** No more repeating the same authentication logic across apps
2. **Consistency:** All authentication logic is centralized and consistent across the entire monorepo
3. **Maintainability:** Changes to authentication logic only need to be made in one place
4. **Type Safety:** Proper TypeScript types for all functions
5. **Flexibility:** Different functions for different use cases
6. **Reusability:** Available to all apps in the monorepo


## Package Location

These utilities are now located in `packages/supabase/src/auth.ts` and exported from `packages/supabase/src/index.ts`, making them available to all apps in the monorepo via `@workspace/supabase`. 