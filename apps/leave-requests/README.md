# Leave Requests App

A comprehensive HR management application for managing employee leave requests, project assignments, and company policies. Built with Next.js 14, Supabase, and TypeScript.

## 🎯 What This App Does

The Leave Requests App is a full-featured HR management system that handles:

- **Employee Leave Management**: Submit, approve, and track leave requests
- **User Management**: Admin controls for employee accounts and permissions
- **Leave Policies**: Configurable leave types and company policies
- **Anniversary Celebrations**: Work anniversary notifications and celebrations
- **Bonus Leave**: Special leave grants and management

## 🏗️ App Structure

```
app/
├── page.tsx                 # Landing page
├── layout.tsx               # Root layout with providers
├── admin/                   # Admin dashboard
│   ├── page.tsx            # Admin overview
│   ├── users/              # User management
│   ├── projects/           # Project management
│   ├── leave-types/        # Leave policy configuration
│   ├── company-policy/     # Company settings
│   ├── bonus-leave/        # Bonus leave management
│   ├── anniversaries/      # Work anniversary tracking
│   ├── set-admin/          # Admin role management
│   └── settings/           # General admin settings
├── dashboard/               # User dashboard
│   ├── page.tsx            # User overview
│   ├── leave/              # Leave request submission
│   ├── my-assignments/     # View project assignments
│   └── profile/            # User profile management
└── auth/                   # Authentication
    ├── login/              # Login page
    ├── sign-up/            # Registration page
    ├── callback/           # OAuth callback
    └── auth-error/         # Authentication error handling
```

## 🚀 Key Features

### **For Employees (User Dashboard)**
- Manage personal profile information
- Submit leave requests with date selection and reason
- View project assignments
- Track leave balance and history
- View working anniversaries / happy birthday

### **For HR Admins (Admin Dashboard)**
- **User Management**: Create, edit, and manage employee accounts
- **Project Management**: Create, edit projects
- **Leave Approval**: Review and approve/reject leave requests
- **Policy Configuration**: Set up leave types and company policies
- **Bonus Leave**: Grant special leave allowances
- **Reports**: View HR reports and analytics

### **Leave System Features**
- **Leave Accrual**: Automatic calculation based on tenure
  - 1st year: 12 days
  - 2nd year: 13 days
  - 3rd year: 15 days
  - 4th year: 18 days
  - 5th year+: 22 days
- **Extended Absences**: Special handling for absences >30 days
- **Project Impact**: Track how leave affects project timelines
- **Approval Workflow**: Multi-level approval system

## 🛠️ Development Setup

> **Note**: For complete setup instructions, see the [root README](../../README.md) in the monorepo.

### **Quick Start**
1. **Install dependencies**: `pnpm install` (from monorepo root)
2. **Set up environment**: Copy `.env.example` to `.env` and configure
3. **Start Supabase**: `cd supabase && supabase start`
4. **Run the app**: `turbo dev` (from monorepo root)

### **Required Environment Variables**
```bash
# Supabase (choose local or cloud)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321          # Local
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co  # Cloud

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🔧 Development Workflows

### **Adding New Features**

#### **1. New Admin Page**
```bash
# Create new admin section
mkdir app/admin/new-feature
touch app/admin/new-feature/page.tsx
```

#### **2. New Component**
```bash
# Add UI component
pnpm dlx shadcn@latest add new-component

# Create custom component
touch components/new-feature/NewFeatureComponent.tsx
```

#### **3. New Database Table**
```bash
# Create migration
cd supabase
supabase migration new create_new_table

# Apply migration
supabase db reset
```

## 🗄️ Database Schema

### **Core Tables**
- **`users`**: Employee information and authentication
- **`leave_requests`**: Leave applications and approvals
- **`projects`**: Project definitions and metadata
- **`project_assignments`**: Team member assignments
- **`leave_types`**: Configurable leave categories
- **`extended_absences`**: Long-term absence tracking
- **`bonus_leave_grants`**: Special leave allowances

**Note**: This app is part of the internal tools monorepo. For workspace-wide utilities, see the `packages/ui` and `packages/supabase` READMEs. 