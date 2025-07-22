create extension if not exists "pgcrypto";

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  leave_type_id integer not null references leave_types(id),
  projects jsonb, -- Array of project objects (id, name, etc.)
  internal_notifications uuid[], -- Array of user IDs for internal notifications
  external_notifications text[], -- Array of email addresses for external notifications
  current_manager_id uuid references users(id), -- Nullable, for approval override
  backup_id uuid references users(id), -- Nullable, backup approver
  start_date date not null,
  end_date date, -- Nullable for half-day requests (if only one day)
  is_half_day boolean not null default false,
  half_day_type text check (half_day_type in ('morning', 'afternoon')),
  message text,
  emergency_contact text,
  status text not null check (status in ('pending', 'approved', 'rejected', 'canceled')),
  approval_notes text,
  cancel_reason text,
  approved_by_id uuid references users(id),
  approved_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leave_requests_user_id on leave_requests(user_id);
create index idx_leave_requests_status on leave_requests(status);
create index idx_leave_requests_start_date on leave_requests(start_date);
create index idx_leave_requests_leave_type_id on leave_requests(leave_type_id);

-- Enable RLS
alter table leave_requests enable row level security;

-- Policy: Users can select/insert their own requests
create policy "Users can view their own leave requests"
  on leave_requests
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leave requests"
  on leave_requests
  for insert
  with check (auth.uid() = user_id);

-- Policy: Admins/managers can select/update/approve all
create policy "Admins and managers can view and update all leave requests"
  on leave_requests
  for all
  using (auth.jwt() ->> 'role' in ('admin', 'manager'));

-- Policy: Service role can do everything
create policy "Service role can do everything"
  on leave_requests
  for all
  using (auth.role() = 'service_role'); 