export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'employee' | 'manager' | 'admin';
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  gender: string | null;
  manager_id: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  is_active?: boolean;
  emailVerified?: Date | null;
  created_at: string;
  updated_at: string;
}

export type Address = {
  id: string;
  user_id: string;
  address_line: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  type?: string; // e.g. 'home', 'work', etc.
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}; 

export type Project = {
  id: string;
  name: string;
  is_billable: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProjectAssignment = {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  is_lead: boolean;
  start_date: string;
  end_date: string | null;
  status: string;
  assigned_by: string | null;
  assigned_at: string | null;
  updated_at: string | null;
  project?: Project;
  user?: User;
};

export type ExtendedAbsence = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
};

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: number;
  projects?: Array<{ id: string; name: string }> | null;
  internal_notifications?: string[] | null;
  external_notifications?: string[] | null;
  current_manager_id?: string | null;
  backup_id?: string | null;
  start_date: string;
  end_date?: string | null;
  is_half_day: boolean;
  half_day_type?: 'morning' | 'afternoon' | null;
  message?: string | null;
  emergency_contact?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  approval_notes?: string | null;
  cancel_reason?: string | null;
  approved_by_id?: string | null;
  approved_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields - Supabase returns arrays for joins
  user?: {
    full_name: string;
    email: string;
  };
  leave_type?: {
    name: string;
    description?: string;
    is_paid?: boolean;
  };
  approved_by?: {
    full_name: string;
  };
  current_manager?: {
    full_name: string;
    email: string;
  };
  backup_person?: {
    full_name: string;
    email: string;
  };
}