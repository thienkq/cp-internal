# User Management Design

## Overview

This document outlines the plan for implementing robust user management in the Leave Request App. The goal is to support company-specific user data, role-based access, and admin features for managing users.

---

## 1. Data Model

### a. Supabase `auth.users`
- Handles authentication (email, password, etc).
- Not extensible for company-specific fields.

### b. `users` Table (New)
Stores business-specific user data and roles.

| Field           | Type    | Description                                 |
|-----------------|---------|---------------------------------------------|
| id              | uuid    | PK, references `auth.users.id`              |
| email             | text  | unique             |
| full_name       | text    | User’s full name                            |
| role            | text    | 'employee', 'manager', 'admin'              |
| start_date      | date    | Employment start date                       |
| end_date        | date    | Employment end date (nullable)              |
| gender          | text    | Gender                                      |
| position        | text    | Job title/position                          |
| manager_id      | uuid    | References another user (manager)           |
| created_at      | timestamptz | Row creation timestamp                  |
| updated_at      | timestamptz | Row update timestamp                    |

---

## 2. Roles

- **Employee:** Can view/edit own profile, submit leave requests.
- **Manager:** Can view/manage team, approve/reject leave.
- **Admin:** Full access, can manage all users, roles, and settings.

---

## 3. Security & Policies

- Enable Row Level Security (RLS) on `users`.
- Users can read and update their own data.

---

## 4. Admin UI Features

- **User List:** Table with search, filter, and sort.
- **User Detail/Edit:** View and edit user info, change role, assign manager.
- **Add User:** Form to add new users.
- **Deactivate/Remove:** Soft delete or set end date.
- **Role Management:** Assign or change user roles.

---

## 5. Integration

- On signup, create a `users` row for each new user.
- Join `auth.users` and `users` for full user info in the app.
- Add “User Management” to the admin sidebar.

---

## 6. Example Table Schema

```sql
create table company_users (
  id uuid primary key references auth.users(id),
  full_name text,
  employee_code text,
  role text check (role in ('employee', 'manager', 'admin')),
  start_date date,
  end_date date,
  gender text,
  position text,
  department text,
  manager_id uuid references company_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7. Future Enhancements

- Audit logs for user changes.
- Bulk import/export (CSV).
- Custom fields per company.

---

## 8. Navigation

- `/admin/users` — User list
- `/admin/users/[id]` — User detail/edit
- `/admin/users/new` — Add user

---

**Review this plan and suggest any changes before implementation.**
