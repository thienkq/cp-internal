# Project User Assignment Feature Plan

## 1. Overview

This feature allows both admins and users to manage project assignments, enabling employees to be assigned to multiple projects with specific roles and billing status. This supports the leave request system's billing logic and client management requirements.

## 2. Business Requirements

### 2.1 Core Functionality
- **Admin Assignment**: Admins can assign users to projects with roles
- **User Self-Assignment**: Users can assign themselves to projects directly
- **Multi-Project Support**: Users can be assigned to multiple projects simultaneously
- **Leave Impact**: Project assignments influence leave request notifications

### 2.2 User Roles & Permissions
- **Admin**: Full CRUD operations on all project assignments
- **Manager**: Can assign team members to projects they manage
- **Employee**: Can view their own assignments and assign themselves to projects
- **HR**: Can view all assignments for reporting purposes

## 3. Database Schema

### 3.1 New Table: `project_assignments`

```sql
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'developer', -- developer, lead, manager, etc.
  is_lead BOOLEAN NOT NULL DEFAULT false, -- Marks the project lead
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means active assignment
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive
  assigned_by UUID REFERENCES users(id), -- Who made the assignment
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

```


## 4. UI Components

### 4.1 Admin Components

#### `components/project-assignments/admin-assignment-table.tsx`
- Table showing all project assignments
- Filters: by project, user, status
- Actions: edit, deactivate
- Bulk operations: assign multiple users to project

#### `components/project-assignments/admin-assignment-form.tsx`
- Form to create/edit project assignments
- User selection with search
- Project selection
- Role configuration
- Lead designation checkbox
- Date range selection

#### `components/project-assignments/assignment-history.tsx`
- List of assignment history
- View assignment changes
- Assignment timeline

### 4.2 User Components

#### `components/project-assignments/user-assignment-list.tsx`
- User's current project assignments
- Add new assignment button
- View assignment history

#### `components/project-assignments/user-assignment-form.tsx`
- Form to add new project assignment
- Project selection with search
- Role selection
- Lead designation checkbox
- Date range selection

### 4.3 Shared Components

#### `components/project-assignments/assignment-status-badge.tsx`
- Visual status indicators
- Color-coded badges for different statuses

#### `components/project-assignments/assignment-filters.tsx`
- Reusable filter component
- Project, user, status, date range filters

## 5. Pages Structure

### 5.1 Admin Pages

```
app/admin/project-assignments/
├── page.tsx                    # Main assignments management
├── [assignmentId]/
│   └── page.tsx               # Edit specific assignment
├── history/
│   └── page.tsx               # Assignment history
└── bulk-assign/
    └── page.tsx               # Bulk assignment tool
```

### 5.2 User Pages

```
app/dashboard/assignments/
├── page.tsx                   # User's assignments overview
├── add/
│   └── page.tsx              # Add new assignment
└── history/
    └── page.tsx              # Assignment history
```

## 6. API Endpoints

### 6.1 Server Actions

```typescript
// app/actions/project-assignments.ts
export async function createAssignment(data: AssignmentFormData)
export async function updateAssignment(id: string, data: AssignmentFormData)
export async function deactivateAssignment(id: string)
export async function bulkAssignUsers(projectId: string, userIds: string[], role: string)
export async function getProjectAssignments(filters: AssignmentFilters)
export async function getUserAssignments(userId: string)
```

## 7. Integration Points

### 7.1 Leave Request System
- **Client Manager Notifications**: Use project assignments to determine client manager email
- **Leave Balance**: Project assignments may affect leave policies

### 7.2 User Management
- **User Profile**: Show current project assignments
- **Manager Assignment**: Link to user's manager for approval workflows

### 7.3 Project Management
- **Project Details**: Show assigned users
- **Project Reports**: Include assignment data in project analytics

## 8. Implementation Phases

### Phase 1: Core Database & Basic Admin UI
- [ ] Create `project_assignments` table with RLS policies
- [ ] Basic admin assignment management (CRUD)
- [ ] Assignment table with filters
- [ ] Assignment form component

### Phase 2: User Self-Service
- [ ] User assignment form
- [ ] User assignment dashboard
- [ ] Assignment history tracking

### Phase 3: Advanced Features
- [ ] Bulk assignment tool
- [ ] Advanced reporting
- [ ] Integration with leave requests

### Phase 4: Future Enhancements
- [ ] Billing rate configuration
- [ ] Billable days calculation
- [ ] Client billing reports
- [ ] Payroll impact reports

## 9. Data Types

```typescript
// types/project-assignments.ts
export interface ProjectAssignment {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  is_lead: boolean;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive';
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  project?: Project;
  assigned_by_user?: User;
}

export interface AssignmentFormData {
  user_id: string;
  project_id: string;
  role: string;
  is_lead: boolean;
  start_date: string;
  end_date?: string;
}

export interface AssignmentFilters {
  project_id?: string;
  user_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}
```

## 10. Email Notifications

### 10.1 Assignment Notifications
- **To User**: Assignment created/modified/deactivated
- **To Project Manager**: New team member assigned

### 10.2 Assignment Changes
- **To User**: Assignment modified/deactivated
- **To Client Manager**: Team member assignment changes

## 11. Testing Strategy

### 11.1 Unit Tests
- Assignment CRUD operations
- RLS policy validation
- Form validation
- Email notification logic

### 11.2 Integration Tests
- Assignment workflow (create → active)
- Bulk assignment operations
- Leave request integration

### 11.3 E2E Tests
- Admin assignment management flow
- User assignment creation flow
- Assignment management workflow

## 12. Success Metrics

- **User Adoption**: % of users actively managing assignments
- **Assignment Creation Time**: Average time to create assignments
- **Data Accuracy**: % of assignments with correct project/role data
- **System Performance**: Assignment query response times

## 13. Future Enhancements

- **Assignment Templates**: Predefined assignment configurations
- **Automated Assignment**: Rules-based automatic assignments
- **Assignment Analytics**: Usage patterns and optimization insights
- **Mobile Support**: Assignment management on mobile devices
- **Calendar Integration**: Assignment changes reflected in calendars 