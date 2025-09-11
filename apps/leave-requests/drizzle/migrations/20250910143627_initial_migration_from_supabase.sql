-- Complete database schema migration from Supabase
-- This migration creates all tables, functions, triggers, policies, and indexes
-- Required for new team members to set up the database from scratch

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM type for domain rule classification
DO $$ BEGIN
  CREATE TYPE public.signup_email_domain_type AS ENUM ('allow', 'deny');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the signup_email_domains table
CREATE TABLE IF NOT EXISTS public.signup_email_domains (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  type public.signup_email_domain_type NOT NULL,
  reason TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a trigger function to maintain updated_at for signup_email_domains
CREATE OR REPLACE FUNCTION public.update_signup_email_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for signup_email_domains
DROP TRIGGER IF EXISTS trg_signup_email_domains_set_updated_at ON public.signup_email_domains;
CREATE TRIGGER trg_signup_email_domains_set_updated_at
BEFORE UPDATE ON public.signup_email_domains
FOR EACH ROW
EXECUTE PROCEDURE public.update_signup_email_domains_updated_at();

-- Create the email domain restriction function
CREATE OR REPLACE FUNCTION public.hook_restrict_signup_by_email_domain(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  email TEXT;
  domain_part TEXT;
  allow_list_exists BOOLEAN;
  is_allowed BOOLEAN;
BEGIN
  email := event->'user'->>'email';
  domain_part := split_part(email, '@', 2);

  -- Check if any 'allow' rules exist in the table.
  SELECT EXISTS (SELECT 1 FROM public.signup_email_domains WHERE type = 'allow') INTO allow_list_exists;

  -- If an allow list exists, we must enforce it.
  IF allow_list_exists THEN
    -- Check if the user's domain is in the allow list.
    SELECT EXISTS (
      SELECT 1
      FROM public.signup_email_domains
      WHERE type = 'allow' AND LOWER(domain) = LOWER(domain_part)
    ) INTO is_allowed;

    IF is_allowed THEN
      -- Domain is in the allow list, so permit the signup.
      RETURN '{}'::JSONB;
    ELSE
      -- Domain is not in the allow list, so reject the signup.
      RETURN jsonb_build_object(
        'error', jsonb_build_object(
          'message', 'Signups from this email domain are not allowed.',
          'http_code', 403
        )
      );
    END IF;
  END IF;

  -- If no 'allow' rules are configured, allow all signups by default.
  RETURN '{}'::JSONB;
END;
$$;

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('employee', 'manager', 'admin')) NOT NULL DEFAULT 'employee',
  start_date DATE,
  end_date DATE,
  gender TEXT,
  position TEXT,
  phone TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT TRUE,
  manager_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If user already exists in public.users by email, update their id to match auth.users.id
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- Update for public.users table
    UPDATE public.users
    SET
        id = NEW.id,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        updated_at = NOW()
    WHERE email = NEW.email;
  -- Else insert a new user row
  ELSE
    INSERT INTO public.users (
      id, email, full_name, role, start_date, end_date, gender, position, manager_id
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'employee',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop existing policies for users if they exist
DROP POLICY IF EXISTS "Admins can perform all actions on users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view other users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create RLS policies for users table
CREATE POLICY "Admins can perform all actions on users"
ON public.users FOR ALL
USING ( public.get_user_role(auth.uid()) = 'admin' )
WITH CHECK ( public.get_user_role(auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view other users"
ON public.users FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- Create the addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  address_line TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  type TEXT, -- e.g. 'home', 'work', etc.
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one primary address per user
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_address_per_user
ON public.addresses (user_id)
WHERE is_primary = TRUE;

-- Create the projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_billable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create the project_assignments table
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'developer',
  is_lead BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Enable Row Level Security for project_assignments
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_assignments
CREATE POLICY admin_crud_project_assignments
  ON public.project_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY user_crud_own_assignments
  ON public.project_assignments
  FOR ALL
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Create leave_types table
CREATE TABLE IF NOT EXISTS public.leave_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  supports_carryover BOOLEAN NOT NULL DEFAULT FALSE,
  supports_half_day BOOLEAN NOT NULL DEFAULT FALSE,
  quota INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for leave_types
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leave_types
CREATE POLICY "Allow read to all authenticated users"
  ON public.leave_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify leave_types"
  ON public.leave_types
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can modify"
  ON public.leave_types
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id SERIAL PRIMARY KEY,
  carryover_expiry_day INTEGER NOT NULL,   -- e.g., 31
  carryover_expiry_month INTEGER NOT NULL, -- e.g., 1 (January)
  tenure_accrual_rules JSONB NOT NULL, -- e.g., {"1":12,"2":13,"3":15,"4":18,"5":22}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_settings
CREATE POLICY "Allow read to all authenticated users"
  ON public.company_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify company_settings"
  ON public.company_settings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can modify"
  ON public.company_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  leave_type_id INTEGER NOT NULL REFERENCES public.leave_types(id),
  projects JSONB, -- Array of project objects (id, name, etc.)
  internal_notifications UUID[], -- Array of user IDs for internal notifications
  external_notifications TEXT[], -- Array of email addresses for external notifications
  current_manager_id UUID REFERENCES public.users(id), -- Nullable, for approval override
  backup_id UUID REFERENCES public.users(id), -- Nullable, backup approver
  start_date DATE NOT NULL,
  end_date DATE, -- Nullable for half-day requests (if only one day)
  is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
  half_day_type TEXT CHECK (half_day_type IN ('morning', 'afternoon')),
  message TEXT,
  emergency_contact TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'canceled')),
  approval_notes TEXT,
  cancel_reason TEXT,
  approved_by_id UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id ON public.leave_requests(leave_type_id);

-- Enable RLS for leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
  ON public.leave_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leave requests"
  ON public.leave_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do everything"
  ON public.leave_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- This policy will be corrected later in the migration
CREATE POLICY "Admins and managers can view and update all leave requests"
  ON public.leave_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update their own pending leave requests"
  ON public.leave_requests
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'canceled')
  );

-- Create extended_absences table
CREATE TABLE IF NOT EXISTS public.extended_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for extended_absences
ALTER TABLE public.extended_absences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for extended_absences
CREATE POLICY "Users can view their own extended absences" ON public.extended_absences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all extended absences" ON public.extended_absences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create bonus_leave_grants table
CREATE TABLE IF NOT EXISTS public.bonus_leave_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
  days_granted INTEGER NOT NULL CHECK (days_granted > 0),
  days_used INTEGER DEFAULT 0 CHECK (days_used >= 0),
  reason TEXT,
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure days_used cannot exceed days_granted
  CHECK (days_used <= days_granted)
);

-- Create indexes for bonus_leave_grants
CREATE INDEX IF NOT EXISTS idx_bonus_leave_grants_user_id ON public.bonus_leave_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_leave_grants_year ON public.bonus_leave_grants(year);
CREATE INDEX IF NOT EXISTS idx_bonus_leave_grants_granted_by ON public.bonus_leave_grants(granted_by);

-- Enable Row Level Security for bonus_leave_grants
ALTER TABLE public.bonus_leave_grants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bonus_leave_grants
CREATE POLICY "Users can view own bonus leave grants" ON public.bonus_leave_grants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bonus leave grants" ON public.bonus_leave_grants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert bonus leave grants" ON public.bonus_leave_grants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update bonus leave grants" ON public.bonus_leave_grants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete bonus leave grants" ON public.bonus_leave_grants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for bonus_leave_grants
CREATE TRIGGER handle_bonus_leave_grants_updated_at
  BEFORE UPDATE ON public.bonus_leave_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update foreign key constraints to include CASCADE options
-- This addresses the changes made in the later Supabase migrations

-- Update leave_requests foreign key
ALTER TABLE public.leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey,
ADD CONSTRAINT leave_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- Update project_assignments foreign key (already has CASCADE from table creation)
ALTER TABLE public.project_assignments
DROP CONSTRAINT IF EXISTS project_assignments_user_id_fkey,
ADD CONSTRAINT project_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- Update addresses FOREIGN KEY (already has CASCADE from table creation)
ALTER TABLE public.addresses
DROP CONSTRAINT IF EXISTS addresses_user_id_fkey,
ADD CONSTRAINT addresses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;
-- Update extended_absences FOREIGN KEY (already has CASCADE from table creation)
ALTER TABLE public.extended_absences
DROP CONSTRAINT IF EXISTS extended_absences_user_id_fkey,
ADD CONSTRAINT extended_absences_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;
-- Update bonus_leave_grants FOREIGN KEY (already has CASCADE from table creation)
ALTER TABLE public.bonus_leave_grants
DROP CONSTRAINT IF EXISTS bonus_leave_grants_user_id_fkey,
ADD CONSTRAINT bonus_leave_grants_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- Grant permissions for signup email domain function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON TABLE public.signup_email_domains TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.hook_restrict_signup_by_email_domain TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.hook_restrict_signup_by_email_domain FROM authenticated, anon, public;

-- Migration complete - all tables, functions, triggers, policies, and indexes created
