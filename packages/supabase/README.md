# Supabase Utilities Package

A comprehensive package providing Supabase client/server utilities, authentication helpers, and database management tools for all apps in the internal tools monorepo.

## 🎯 Purpose

This package serves as the **centralized Supabase integration layer** for the entire monorepo, providing:

- **Authentication Utilities**: User management, session handling, and auth guards
- **Database Clients**: Type-safe Supabase client instances for browser and server
- **Middleware Integration**: Next.js middleware for authentication and routing
- **Type Definitions**: Shared TypeScript types for database schemas
- **Consistent Configuration**: Unified Supabase setup across all apps

## 🚀 Available Utilities

### **Authentication Functions**

#### **`getCurrentUser()`**
Gets the current authenticated user and Supabase client.

**Returns:** `Promise<{ user: User | null, supabase: SupabaseClient }>`

**Use case:** When you need both the user and the Supabase client for database operations.

```typescript
import { getCurrentUser } from "@workspace/supabase";

export default async function MyComponent() {
  const { user, supabase } = await getCurrentUser();
  
  if (user) {
    // User is authenticated
    const { data } = await supabase.from('users').select('*').eq('id', user.id);
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <div>Please sign in</div>;
}
```

#### **`getUser()`**
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

#### **`requireAuth(redirectTo?)`**
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

### **Client Functions**

#### **`createBrowserClient()`**
Creates a Supabase client for browser-side operations.

```typescript
import { createBrowserClient } from "@workspace/supabase";

const supabase = createBrowserClient();

// Use in client components
const { data } = await supabase.from('users').select('*');
```

#### **`createServerClient()`**
Creates a Supabase client for server-side operations with proper cookie handling.

```typescript
import { createServerClient } from "@workspace/supabase";

export async function GET(request: Request) {
  const supabase = createServerClient(request);
  
  // Use in API routes or server components
  const { data } = await supabase.from('users').select('*');
  return Response.json(data);
}
```

## 📦 Installation & Usage

### **Importing Utilities**

```typescript
// Authentication utilities
import { getCurrentUser, getUser, requireAuth } from "@workspace/supabase";

// Client creation
import { createBrowserClient, createServerClient } from "@workspace/supabase";

// Middleware
import { updateSession } from "@workspace/supabase";
```

### **Environment Setup**

Ensure your app has the required environment variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Development

### **Package Structure**
```
src/
├── auth.ts              # Authentication utilities
├── client.ts            # Client creation functions
├── server.ts            # Server-side utilities
├── middleware.ts        # Middleware integration
├── hooks/               # Custom React hooks
└── index.ts             # Main exports
```


## 📦 Package Information

- **Location**: `packages/supabase/`
- **Import Path**: `@workspace/supabase`
- **Dependencies**: Supabase JS, Next.js, React
- **Build Output**: Compiled to `dist/` directory

---

**Note**: This package provides the foundation for all Supabase operations in the monorepo. Apps should import from `@workspace/supabase`, not from the `dist/` directory directly. 