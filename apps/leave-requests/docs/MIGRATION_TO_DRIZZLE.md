# Migration from Supabase to Drizzle ORM

This document outlines the process of migrating from Supabase client to Drizzle ORM for database management while preserving all existing data and functionality.

## Overview

- **From**: Supabase client with migrations in `supabase/migrations/`
- **To**: Drizzle ORM with migrations in `drizzle/migrations/`
- **Goal**: Use Drizzle for all future database schema changes while preserving existing data

## Migration Steps

### 1. Initial Setup (COMPLETED)

✅ **Drizzle Configuration**: `drizzle.config.ts` is already configured
✅ **Schema Definition**: All tables are defined in `db/schema.ts`
✅ **Dependencies**: `drizzle-orm` and `drizzle-kit` are installed

### 2. Migration Generation (COMPLETED)

✅ **Initial Migration Created**: `drizzle/migrations/20250910143627_initial_migration_from_supabase.sql`

This migration includes:
- All table definitions with proper constraints
- Indexes and foreign keys
- Row Level Security (RLS) policies
- Database functions (`get_user_role`, `handle_new_user`, etc.)
- Triggers for user creation and timestamp updates
- Extensions and permissions

### 3. Migration Tracking Setup (COMPLETED)

✅ **COMPLETED**: Migration tracking has been set up successfully.

The setup included:
- Created the `__drizzle_migrations` table
- Marked the initial migration as "applied" without running it
- Prevents Drizzle from trying to recreate existing tables
- Tested with a sample migration to verify the system works

If you need to reset the migration tracking, you can run:
```bash
npm run db:setup-tracking
```

### 4. Verification (COMPLETED)

✅ **COMPLETED**: Migration system has been tested and verified.

The verification included:
- ✅ Migration status check: `npm run db:check` - Everything's fine 🐶🔥
- ✅ Test migration created and applied successfully
- ✅ Test migration cleanup completed
- ✅ Database schema matches Drizzle definitions

You can still run these commands to verify:
```bash
# Check migration status
npm run db:check

# View current schema in Drizzle Studio
npm run db:studio
```

## Future Workflow

### Creating New Migrations

1. **Modify Schema**: Update `db/schema.ts` with your changes
2. **Generate Migration**: `npm run db:generate -- --name "your_migration_name"`
3. **Review Migration**: Check the generated SQL in `drizzle/migrations/`
4. **Apply Migration**: `npm run db:migrate`

### Available Commands

```bash
# Generate new migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Check migration status
npm run db:check

# Setup migration tracking (run once)
npm run db:setup-tracking
```

## Important Notes

### ⚠️ Do NOT Run These Commands Initially

- `npm run db:migrate` - Don't run until after setup-tracking
- `npm run db:push` - This will try to recreate existing tables
- `npm run db:reset` - This will drop all your data

### ✅ Safe Commands

- `npm run db:generate` - Safe to generate new migrations
- `npm run db:studio` - Safe to view database
- `npm run db:check` - Safe to check status
- `npm run db:setup-tracking` - Run once for initial setup

## File Structure

```
apps/leave-requests/
├── db/
│   ├── schema.ts              # Drizzle schema definitions
│   └── index.ts               # Database connection
├── drizzle/
│   ├── migrations/            # Drizzle migrations
│   └── meta/                  # Migration metadata
├── supabase/
│   └── migrations/            # Legacy Supabase migrations (keep for reference)
├── scripts/
│   ├── setup-drizzle-tracking.ts    # Migration tracking setup
│   └── setup-drizzle-migration-tracking.sql
└── drizzle.config.ts          # Drizzle configuration
```

## Troubleshooting

### If You Accidentally Run Migrations

If you accidentally run `npm run db:migrate` before setup:

1. Check what was applied: `SELECT * FROM __drizzle_migrations;`
2. If tables were duplicated, you may need to restore from backup
3. Contact your database administrator for assistance

### Migration Conflicts

If you encounter migration conflicts:

1. Check current database state
2. Review migration files in `drizzle/migrations/`
3. Use `npm run db:check` to see pending migrations
4. Manually resolve conflicts if necessary

## Next Steps

1. **Run the setup**: `npm run db:setup-tracking`
2. **Test the workflow**: Create a small test migration
3. **Update your application**: Replace Supabase client calls with Drizzle queries
4. **Archive Supabase migrations**: Keep them for reference but don't use for new changes

## Migration Status Summary

✅ **MIGRATION COMPLETED SUCCESSFULLY**

### What was accomplished:
1. ✅ **Drizzle Configuration**: Already configured and working
2. ✅ **Schema Definition**: All tables defined in `db/schema.ts`
3. ✅ **Initial Migration**: Created with no-op content to prevent table recreation
4. ✅ **Migration Tracking**: Set up and tested successfully
5. ✅ **System Verification**: Tested with sample migrations
6. ✅ **Documentation**: Complete migration guide created

### Current State:
- **Database**: All existing tables, functions, and policies preserved
- **Migration System**: Fully functional Drizzle migration system
- **Next Steps**: Ready for new schema changes using Drizzle workflow

### Migration Files Created:
- `drizzle/migrations/20250910143627_initial_migration_from_supabase.sql` (no-op)
- `scripts/setup-drizzle-migration-tracking.sql` (setup script)
- `MIGRATION_TO_DRIZZLE.md` (this documentation)
- `REFERENCE_complete_initial_migration.sql` (reference only)

## Support

If you encounter issues during future migrations:
1. Check the migration logs
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Review the generated migration SQL before applying
5. Use `npm run db:check` to verify migration status
