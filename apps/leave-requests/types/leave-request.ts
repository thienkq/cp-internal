// Leave Type interface for form props
export interface LeaveType {
  id: number;
  name: string;
  description?: string | null;
  is_paid: boolean;
  supports_half_day: boolean;
  supports_carryover: boolean;
  quota: number | null;
}

// Project interface for form props (simplified version)
export interface ProjectForm {
  id: string;
  name: string;
}

// User interface for form props (simplified version)
export interface UserForm {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

// Common props interface for page client components
export interface LeaveRequestPageProps {
  leaveTypes: LeaveType[];
  projects: ProjectForm[];
  users: UserForm[];
}

// Edit mode interface for leave request form
export interface LeaveRequestEditMode {
  isEditing: true;
  requestId: string;
  initialData: Record<string, unknown>;
}

// Props interface for edit page client component
export interface EditLeaveRequestPageProps extends LeaveRequestPageProps {
  leaveRequest: Record<string, unknown>;
}
