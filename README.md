# Internal Tools Monorepo

A monorepo for CoderPush internal apps and packages, powered by Turborepo and Next.js. All code is written in [TypeScript](https://www.typescriptlang.org/).

---

## Project Structure

```
internal/
├── apps/
│   └── leave-requests/      # Next.js app for leave requests
│       ├── app/
│       │   ├── page.tsx
│       │   ├── admin/       # Admin dashboard
│       │   │   ├── page.tsx
│       │   │   ├── users/
│       │   │   ├── projects/
│       │   │   ├── leave-types/
│       │   │   ├── company-policy/
│       │   │   ├── bonus-leave/
│       │   │   ├── anniversaries/
│       │   │   ├── set-admin/
│       │   │   └── settings/
│       │   ├── dashboard/   # User dashboard
│       │   │   ├── page.tsx
│       │   │   ├── leave/
│       │   │   ├── my-assignments/
│       │   │   └── profile/
│       │   ├── auth/        # Authentication pages
│       │   │   ├── login/
│       │   │   ├── sign-up/
│       │   │   ├── callback/
│       │   │   └── auth-error/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── admin/       # Admin-specific components
│       │   ├── auth/        # Authentication components
│       │   ├── dashboard/   # Dashboard components
│       │   ├── layout/      # Layout components
│       │   ├── leave/       # Leave request components
│       │   ├── projects/    # Project management components
│       │   ├── users/       # User management components
│       │   └── common/      # Shared components
│       ├── lib/             # Utility functions
│       ├── supabase/        # Database migrations & config
│       ├── types/           # TypeScript type definitions
│       ├── hooks/           # Custom React hooks
│       ├── components.json
│       └── package.json
├── packages/
│   ├── ui/                  # Shared React UI component library (shadcn/ui, Tailwind CSS)
│   │   ├── src/components/
│   │   │   └── button.tsx
│   │   ├── src/styles/globals.css
│   │   ├── hooks
│   │   ├── lib
│   │   └── package.json
│   ├── supabase/            # Supabase client/server utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── auth.ts      # Authentication utilities
│   │   │   └── middleware.ts
│   │   └── package.json
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TypeScript config
├── package.json
├── turbo.json
└── ...
```

---

## Apps

- **leave-requests**: Next.js app for managing employee leave requests and HR operations
  - **Admin Dashboard**: Manage users, projects, leave policies, bonus leave, work anniversaries, and company settings
  - **User Dashboard**: Submit leave requests, view project assignments, and manage personal profile
  - **Authentication**: Google OAuth integration

## Packages

- **ui**: Shared React component library (shadcn/ui, Tailwind CSS)
- **supabase**: Supabase client/server utilities with authentication helpers
- **@workspace/eslint-config**: Shared ESLint config
- **@workspace/typescript-config**: Shared TypeScript config

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd internal
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Google OAuth for Supabase Local

You'll need to configure Google OAuth in both your Google Cloud Console and Supabase Local. Here's how:

##### **Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Configure OAuth consent screen (APIs & Services → OAuth consent screen) 
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs" 
5. Set Application Type to "Web application" 
6. Add Authorized redirect URIs:
   - **Local**: `http://localhost:54321/auth/v1/callback`
   - **Production**: `https://your-project.supabase.co/auth/v1/callback`

##### **Supabase Local Setup:**
```bash
cd apps/leave-requests/supabase
```

Create `.env` file with your Google OAuth credentials:

```bash
# Google OAuth for local Supabase
SUPABASE_AUTH_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_GOOGLE_SECRET=your_google_secret
```

### 4. Start local Supabase

Prerequisite: Supabase CLI version >= 2.30.4 to support hooks

```bash
cd apps/leave-requests
supabase start
```

After starting, you'll see output like this:
```bash
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
```

Initialize the database in local 

```
supabase db reset
```

### 5. Set up app environment variables

```bash
cd apps/leave-requests
cp .env.example .env
```

**Update your `.env` file with the keys from step 4:**
```bash
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step_4
```

### 6. Start development servers

From the monorepo **root**:

```bash
cd ../..
turbo dev
```

---

## UI Components (shadcn/ui)

- Shared UI components are in `packages/ui/src/components`.
- To add components to your project, run the add command in the **path** of your app

```bash
cd apps/leave-requests
pnpm dlx shadcn@latest add <component>
```

- Import components in your app like this:

```tsx
import { Button } from "@workspace/ui/components/button"
```

- Tailwind CSS is preconfigured. Styles are shared via `packages/ui/src/styles/globals.css`.

---

## Supabase Usage

- Use the Supabase client/server utilities in your apps:

```ts
import { createServerClient } from "@workspace/supabase"
import { createBrowserClient } from "@workspace/supabase"
```


## Notes

- All packages and apps use TypeScript.
- You can consume `@workspace/ui` directly from source without building.
- The `@workspace/supabase` package builds compiled code into the `dist` directory. **Apps should always import from `@workspace/supabase`**, not from `dist` directly.
- For more details, see each package/app's README or documentation.

---



