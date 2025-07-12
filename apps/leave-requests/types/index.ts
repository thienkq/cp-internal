export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'admin';
  position: string;
  start_date: string;
  end_date: string | null;
  gender: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
} 