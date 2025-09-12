import {
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  integer, 
  boolean, 
  date, 
  jsonb, 
  serial,
  check,
  index,
  pgEnum,
  varchar,
  unique,
  foreignKey,
  pgPolicy,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const signupEmailDomainType = pgEnum('signup_email_domain_type', ['allow', 'deny']);

// Signup Email Domains table
export const signupEmailDomains = pgTable('signup_email_domains', {
  id: serial().primaryKey().notNull(),
  domain: text().notNull(),
  type: signupEmailDomainType().notNull(),
  reason: text(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique('signup_email_domains_domain_key').on(table.domain),
]);

// Users table
export const users = pgTable('users', {
  id: uuid().primaryKey().notNull(),
  email: text(),
  full_name: text('full_name'),
  role: text().default('employee').notNull(),
  start_date: date('start_date'),
  end_date: date('end_date'),
  gender: text(),
  position: text(),
  phone: text(),
  date_of_birth: date('date_of_birth'),
  is_active: boolean('is_active').default(true),
  manager_id: uuid('manager_id'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.manager_id],
    foreignColumns: [table.id],
    name: 'users_manager_id_fkey'
  }),
  unique('users_email_key').on(table.email),
  pgPolicy('Admins can perform all actions on users', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'], 
    using: sql`(get_user_role(auth.uid()) = 'admin'::text)`, 
    withCheck: sql`(get_user_role(auth.uid()) = 'admin'::text)`  
  }),
  pgPolicy('Authenticated users can view other users', { 
    as: 'permissive', 
    for: 'select', 
    to: ['authenticated'] 
  }),
  pgPolicy('Users can update their own profile', { 
    as: 'permissive', 
    for: 'update', 
    to: ['authenticated'],
    using: sql`(auth.uid() = id)`,
    withCheck: sql`(auth.uid() = id)`
  }),
  check('users_role_check', sql`role = ANY (ARRAY['employee'::text, 'manager'::text, 'admin'::text])`),
]);

// Addresses table
export const addresses = pgTable('addresses', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id'),
  address_line: text('address_line').notNull(),
  city: text(),
  state: text(),
  postal_code: text('postal_code'),
  country: text(),
  type: text(),
  is_primary: boolean('is_primary').default(false),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('one_primary_address_per_user').using('btree', table.user_id.asc().nullsLast().op('uuid_ops')).where(sql`(is_primary = true)`),
  foreignKey({
    columns: [table.user_id],
    foreignColumns: [users.id],
    name: 'addresses_user_id_fkey'
  }).onDelete('cascade'),
]);

// Projects table
export const projects = pgTable('projects', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  is_billable: boolean('is_billable').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  unique('projects_name_key').on(table.name),
  pgPolicy('Anyone can view projects', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`true` 
  }),
  pgPolicy('Admins can manage projects', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`,
    withCheck: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
]);

// Project Assignments table
export const projectAssignments = pgTable('project_assignments', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id').notNull(),
  project_id: uuid('project_id').notNull(),
  role: varchar({ length: 50 }).default('developer').notNull(),
  is_lead: boolean('is_lead').default(false).notNull(),
  start_date: date('start_date').default(sql`CURRENT_DATE`).notNull(),
  end_date: date('end_date'),
  status: varchar({ length: 20 }).default('active').notNull(),
  assigned_by: uuid('assigned_by'),
  assigned_at: timestamp('assigned_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.user_id],
    foreignColumns: [users.id],
    name: 'project_assignments_user_id_fkey'
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.project_id],
    foreignColumns: [projects.id],
    name: 'project_assignments_project_id_fkey'
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.assigned_by],
    foreignColumns: [users.id],
    name: 'project_assignments_assigned_by_fkey'
  }),
  pgPolicy('admin_crud_project_assignments', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'], 
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`, 
    withCheck: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`  
  }),
  pgPolicy('user_crud_own_assignments', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`user_id = auth.uid()`,
    withCheck: sql`user_id = auth.uid()`
  }),
  check('valid_date_range', sql`(end_date IS NULL) OR (end_date >= start_date)`),
]);

// Company Settings table
export const companySettings = pgTable('company_settings', {
  id: serial().primaryKey().notNull(),
  carryover_expiry_day: integer('carryover_expiry_day').notNull(),
  carryover_expiry_month: integer('carryover_expiry_month').notNull(),
  tenure_accrual_rules: jsonb('tenure_accrual_rules').notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, () => [
  pgPolicy('Allow read to all authenticated users', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`(auth.role() = 'authenticated'::text)` 
  }),
  pgPolicy('Admins can modify company_settings', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(auth.jwt() ->> 'role' = 'admin'::text)`
  }),
  pgPolicy('Service role can modify', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(auth.role() = 'service_role'::text)`
  }),
]);

// Leave Types table
export const leaveTypes = pgTable('leave_types', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  is_paid: boolean('is_paid').default(true).notNull(),
  supports_carryover: boolean('supports_carryover').default(false).notNull(),
  supports_half_day: boolean('supports_half_day').default(false).notNull(),
  quota: integer(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique('leave_types_name_key').on(table.name),
  pgPolicy('Allow read to all authenticated users', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`(auth.role() = 'authenticated'::text)` 
  }),
  pgPolicy('Admins can modify leave_types', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(auth.jwt() ->> 'role' = 'admin'::text)`
  }),
  pgPolicy('Service role can modify', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(auth.role() = 'service_role'::text)`
  }),
]);

// Leave Requests table
export const leaveRequests = pgTable('leave_requests', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id').notNull(),
  leave_type_id: integer('leave_type_id').notNull(),
  projects: jsonb(),
  internal_notifications: uuid('internal_notifications').array(),
  external_notifications: text('external_notifications').array(),
  current_manager_id: uuid('current_manager_id'),
  backup_id: uuid('backup_id'),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  is_half_day: boolean('is_half_day').default(false).notNull(),
  half_day_type: text('half_day_type'),
  message: text(),
  emergency_contact: text('emergency_contact'),
  status: text().notNull(),
  approval_notes: text('approval_notes'),
  cancelReason: text('cancel_reason'),
  approved_by_id: uuid('approved_by_id'),
  approved_at: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
  canceled_at: timestamp('canceled_at', { withTimezone: true, mode: 'string' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_leave_requests_leave_type_id').using('btree', table.leave_type_id.asc().nullsLast().op('int4_ops')),
  index('idx_leave_requests_start_date').using('btree', table.start_date.asc().nullsLast().op('date_ops')),
  index('idx_leave_requests_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
  index('idx_leave_requests_user_id').using('btree', table.user_id.asc().nullsLast().op('uuid_ops')),
  foreignKey({
    columns: [table.leave_type_id],
    foreignColumns: [leaveTypes.id],
    name: 'leave_requests_leave_type_id_fkey'
  }),
  foreignKey({
    columns: [table.current_manager_id],
    foreignColumns: [users.id],
    name: 'leave_requests_current_manager_id_fkey'
  }),
  foreignKey({
    columns: [table.backup_id],
    foreignColumns: [users.id],
    name: 'leave_requests_backup_id_fkey'
  }),
  foreignKey({
    columns: [table.approved_by_id],
    foreignColumns: [users.id],
    name: 'leave_requests_approved_by_id_fkey'
  }),
  foreignKey({
    columns: [table.user_id],
    foreignColumns: [users.id],
    name: 'leave_requests_user_id_fkey'
  }).onUpdate('cascade').onDelete('cascade'),
  pgPolicy('Users can view their own leave requests', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`(auth.uid() = user_id)` 
  }),
  pgPolicy('Users can insert their own leave requests', { 
    as: 'permissive', 
    for: 'insert', 
    to: ['public'],
    withCheck: sql`(auth.uid() = user_id)`
  }),
  pgPolicy('Service role can do everything', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(auth.role() = 'service_role'::text)`
  }),
  pgPolicy('Admins and managers can view and update all leave requests', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = ANY (ARRAY['admin'::text, 'manager'::text])))))`,
    withCheck: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = ANY (ARRAY['admin'::text, 'manager'::text])))))`
  }),
  pgPolicy('Users can update their own pending leave requests', { 
    as: 'permissive', 
    for: 'update', 
    to: ['public'],
    using: sql`((auth.uid() = user_id) AND (status = 'pending'::text))`,
    withCheck: sql`((auth.uid() = user_id) AND (status = ANY (ARRAY['pending'::text, 'canceled'::text])))`
  }),
  check('leave_requests_half_day_type_check', sql`half_day_type = ANY (ARRAY['morning'::text, 'afternoon'::text])`),
  check('leave_requests_status_check', sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'canceled'::text])`),
]);

// Extended Absences table
export const extendedAbsences = pgTable('extended_absences', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id'),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  reason: text(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.user_id],
    foreignColumns: [users.id],
    name: 'extended_absences_user_id_fkey'
  }).onDelete('cascade'),
  pgPolicy('Users can view their own extended absences', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`(auth.uid() = user_id)` 
  }),
  pgPolicy('Admins can manage all extended absences', { 
    as: 'permissive', 
    for: 'all', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
]);

// Bonus Leave Grants table
export const bonusLeaveGrants = pgTable('bonus_leave_grants', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  user_id: uuid('user_id').notNull(),
  year: integer().notNull(),
  days_granted: integer('days_granted').notNull(),
  days_used: integer('days_used').default(0),
  reason: text(),
  granted_by: uuid('granted_by'),
  granted_at: timestamp('granted_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_bonus_leave_grants_granted_by').using('btree', table.granted_by.asc().nullsLast().op('uuid_ops')),
  index('idx_bonus_leave_grants_user_id').using('btree', table.user_id.asc().nullsLast().op('uuid_ops')),
  index('idx_bonus_leave_grants_year').using('btree', table.year.asc().nullsLast().op('int4_ops')),
  foreignKey({
    columns: [table.user_id],
    foreignColumns: [users.id],
    name: 'bonus_leave_grants_user_id_fkey'
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.granted_by],
    foreignColumns: [users.id],
    name: 'bonus_leave_grants_granted_by_fkey'
  }),
  pgPolicy('Users can view own bonus leave grants', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'], 
    using: sql`(auth.uid() = user_id)` 
  }),
  pgPolicy('Admins can view all bonus leave grants', { 
    as: 'permissive', 
    for: 'select', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
  pgPolicy('Admins can insert bonus leave grants', { 
    as: 'permissive', 
    for: 'insert', 
    to: ['public'],
    withCheck: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
  pgPolicy('Admins can update bonus leave grants', { 
    as: 'permissive', 
    for: 'update', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`,
    withCheck: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
  pgPolicy('Admins can delete bonus leave grants', { 
    as: 'permissive', 
    for: 'delete', 
    to: ['public'],
    using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))`
  }),
  check('bonus_leave_grants_year_check', sql`(year >= 2020) AND (year <= 2030)`),
  check('bonus_leave_grants_days_granted_check', sql`days_granted > 0`),
  check('bonus_leave_grants_days_used_check', sql`days_used >= 0`),
  check('bonus_leave_grants_check', sql`days_used <= days_granted`),
]);

