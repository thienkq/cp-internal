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
  phone?: string;
  date_of_birth?: string;
  is_active?: boolean;
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