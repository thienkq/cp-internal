# Manager Dashboard Feature

## Overview

This feature provides a complete manager dashboard system that allows managers to approve/reject leave requests for their team members. Managers can access this through dedicated routes and views.

## Features Implemented

### 1. Manager Dashboard Routes
- **`/manager`** - Main manager dashboard with overview statistics
- **`/manager/leave-requests`** - All team leave requests with filtering
- **`/manager/approvals`** - Pending requests requiring approval
- **`/manager/team`** - Team member management and statistics

### 2. Manager Layout & Navigation
- **File**: `app/manager/layout.tsx`
- **Component**: `components/layout/manager-sidebar.tsx` 
- **Features**:
  - Dedicated manager sidebar with navigation
  - Role-based access (manager and admin roles)
  - Clean UI consistent with admin dashboard

### 3. Manager Actions
- **File**: `app/manager/actions.ts`
- **Functions**:
  - `approveLeaveRequest()` - Approve team member requests
  - `rejectLeaveRequest()` - Reject team member requests  
  - `cancelLeaveRequest()` - Cancel team member requests
- **Security**: 
  - Validates manager role
  - Ensures manager can only act on their team's requests
  - Uses same database operations as admin actions

### 4. Dashboard Pages

#### Main Dashboard (`/manager`)
- **Overview statistics**: Pending approvals, approved requests, team size
- **Urgent requests**: Requests starting within 7 days
- **Recent requests**: Latest team leave requests
- **Action buttons**: Approve/reject pending requests

#### Leave Requests (`/manager/leave-requests`) 
- **Filtering**: By status (pending, approved, rejected) and year
- **Statistics cards**: Visual count of each status type
- **Full table view**: All team requests with user information
- **Actions**: Approve/reject buttons for pending requests

#### Approvals (`/manager/approvals`)
- **Urgent section**: Requests starting within 7 days (highlighted)
- **Regular section**: Other pending requests
- **Quick stats**: Total pending, urgent count, regular count
- **Action interface**: Approve/reject with notes

#### Team Management (`/manager/team`)
- **Team member list**: All people reporting to the manager
- **Member statistics**: Request counts per team member
- **Visual indicators**: Pending/approved request badges
- **Team overview**: Total members, active requests, approved count

### 5. Updated Components

#### LeaveRequestActions Component
- **File**: `components/admin/leave-request-actions.tsx`
- **Enhancement**: Added `isManagerView` prop
- **Functionality**: Routes to manager actions when in manager context
- **UI**: Same approve/reject/cancel interface for consistency

#### Navigation Integration
- **File**: `components/user-dropdown-menu.tsx`
- **Enhancement**: Added "Manager Dashboard" link for manager role users
- **Access**: Shows up in user dropdown for managers and admins

### 6. Component Updates
- **LeaveRequestList**: Added `isManagerView` prop support
- **LeaveRequestTable**: Added `isManagerView` prop support  
- **Manager pages**: All use `isManagerView={true}` for proper action routing

## How It Works

### For Managers:
1. **Access**: Managers see "Manager Dashboard" in user dropdown
2. **Overview**: Dashboard shows team statistics and pending requests
3. **Approval**: Click approve/reject on any pending request
4. **Filtering**: View requests by status, year, or urgency
5. **Team**: See all team members and their request history

### Manager Permissions:
- Can approve/reject requests where they are assigned as `current_manager_id`
- Cannot modify requests for other teams
- Have same action interface as admins but with scope restrictions
- See only their team's data across all views

### Database Security:
- Manager actions validate ownership of requests
- Database RLS policies allow manager role operations
- Server-side verification prevents unauthorized access
- Audit trail maintained (approved_by_id tracks who took action)

## Usage Examples

### Setting Up Manager Access:
1. User must have `role = 'manager'` in users table
2. Leave requests must have `current_manager_id` set to manager's user ID
3. Manager can then access `/manager` dashboard

### Typical Manager Workflow:
1. Login → See "Manager Dashboard" in dropdown
2. Go to dashboard → See pending requests summary
3. Click "Pending Approvals" → Review urgent requests first
4. For each request → Click Approve/Reject → Add notes → Confirm
5. View "Team Leave Requests" → Filter by status/year for historical view

## Benefits

- **Distributed Approval**: Managers can approve their team's requests without admin involvement
- **Improved Efficiency**: Dedicated manager interface reduces admin workload  
- **Better Visibility**: Managers see comprehensive team leave data
- **Role Separation**: Clear distinction between admin and manager capabilities
- **Consistent UX**: Same action interface as admin dashboard

## Files Added/Modified

### New Files:
- `app/manager/layout.tsx`
- `app/manager/page.tsx` 
- `app/manager/leave-requests/page.tsx`
- `app/manager/approvals/page.tsx`
- `app/manager/team/page.tsx`
- `app/manager/actions.ts`
- `components/layout/manager-sidebar.tsx`

### Modified Files:
- `components/admin/leave-request-actions.tsx` - Added manager support
- `components/leave/leave-request-list.tsx` - Added isManagerView prop
- `components/leave/leave-request-table.tsx` - Added isManagerView prop  
- `components/user-dropdown-menu.tsx` - Added manager dashboard link

## Security Considerations

- Managers can only access their assigned team's requests
- Database queries filter by `current_manager_id = user.id`
- Server actions validate manager permissions
- No elevation of privileges beyond assigned responsibilities
- Audit trail preserved for all manager actions