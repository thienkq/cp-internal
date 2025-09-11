# Database Migration Guide

## Overview

This guide explains the database schema migration from Supabase to Drizzle ORM and provides instructions for new team members to set up the database correctly.

## Current State

The project has been migrated from using Supabase client directly to using Drizzle ORM for database operations. However, the database still uses Supabase's PostgreSQL instance with all the necessary auth functions, RLS policies, and triggers.

## Database Schema

### Tables Created

1. **signup_email_domains** - Controls which email domains can sign up
2. **users** - Main user table (references auth.users)
3. **addresses** - User addresses with primary address constraint
4. **projects** - Project management
5. **project_assignments** - User-project assignments
6. **leave_types** - Types of leave (vacation, sick, etc.)
7. **company_settings** - Company-wide leave settings
8. **leave_requests** - Leave request records
9. **extended_absences** - Long-term absences
10. **bonus_leave_grants** - Additional leave grants

### Key Database Objects

#### Functions
- `hook_restrict_signup_by_email_domain()` - Email domain validation
- `get_user_role()` - Helper function to get user role without recursion
- `handle_new_user()` - Auto-creates user record on auth signup
- `handle_updated_at()` - Updates timestamp on record changes
- `update_signup_email_domains_updated_at()` - Specific updater for email domains

#### Triggers
- `on_auth_user_created` - Automatically creates user record when auth user is created
- `trg_signup_email_domains_set_updated_at` - Updates timestamp on email domain changes
- `handle_bonus_leave_grants_updated_at` - Updates timestamp on bonus leave changes

#### Row Level Security (RLS) Policies
All tables have comprehensive RLS policies that control:
- Admin access (full CRUD)
- User access to own records
- Manager access where appropriate
- Service role access for system operations

## For New Team Members

### Initial Database Setup

1. **Prerequisites**
   - PostgreSQL database (Supabase or local)
   - Database URL in environment variables
   - Drizzle Kit installed

2. **Run the Migration**
   ```bash
   cd apps/leave-requests
   npx drizzle-kit migrate
   ```

3. **Verify Schema**
   ```bash
   npx drizzle-kit introspect
   ```

### Important Notes

#### Schema Consistency
- The Drizzle schema in `db/schema.ts` matches the database structure
- All RLS policies are defined in both the migration SQL and the Drizzle schema
- Foreign key relationships include proper CASCADE options

#### Key Differences from Standard Drizzle Setup
- Users table references `auth.users(id)` (Supabase auth)
- RLS policies are essential for security
- Several database functions and triggers are required for proper operation

#### Migration File Structure
- `drizzle/migrations/20250910143627_initial_migration_from_supabase.sql` contains the complete schema
- This single migration creates all tables, functions, triggers, and policies
- The migration is idempotent (safe to run multiple times)

### Development Workflow

1. **Making Schema Changes**
   - Update `db/schema.ts` first
   - Generate migration: `npx drizzle-kit generate`
   - Review generated SQL
   - Apply migration: `npx drizzle-kit migrate`

2. **Database Operations**
   - Use Drizzle ORM for all database operations
   - Import from `db/index.ts` for database connection
   - Follow existing patterns in the codebase

### Troubleshooting

#### Common Issues
1. **Migration fails**: Check database connection and permissions
2. **RLS errors**: Ensure user has proper role in users table
3. **Auth issues**: Verify Supabase auth configuration

#### Verification Steps
1. Check all tables exist: `\dt` in psql
2. Verify RLS is enabled: `\d+ table_name`
3. Test policies with different user roles
4. Confirm triggers are active: `\df` for functions

## Schema Validation

The migration includes all elements from the original Supabase migrations:
- ✅ All tables with correct structure
- ✅ All indexes for performance
- ✅ All foreign key constraints with CASCADE
- ✅ All RLS policies for security
- ✅ All database functions and triggers
- ✅ Proper enum types
- ✅ Check constraints for data validation

## Next Steps

1. Test the migration in a development environment
2. Verify all application functionality works with Drizzle ORM
3. Update any remaining Supabase client calls to use Drizzle
4. Consider adding database seeding scripts for development

## Support

If you encounter issues:
1. Check the migration logs
2. Verify environment variables
3. Ensure database permissions are correct
4. Review the original Supabase migrations for reference
