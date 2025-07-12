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
│       │   ├── dashboard/
│       │   │   └── layout.tsx
│       │   └── auth/
│       │       └── login/
│       ├── components/
│       │   ├── layout/
│       │   │   └── top-navbar.tsx
│       │   ├── user-dropdown-menu.tsx
│       │   └── auth-button.tsx
│       ├── lib/
│       │   └── utils.ts
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

- **leave-requests**: Next.js app for managing leave requests

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

### 3. Set up environment variables

For the `leave-requests` app:

```bash
cd apps/leave-requests
cp .env.example .env
```

Set up google login via supabase


```
cd apps/leave-request/supabase
```

Edit `.env` with your Supabase configuration:

```
SUPABASE_AUTH_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_GOOGLE_SECRET=your_google_secret
```

### 4. Start local Supabase (if using Supabase CLI)

Prerequisite: Supabase CLI version >= 2.30.4 to support hooks

```bash
supabase start
```

### 5. Start development servers

From the monorepo **root**:

```bash
cd ..
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



