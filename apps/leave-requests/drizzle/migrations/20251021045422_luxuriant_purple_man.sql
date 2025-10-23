ALTER TABLE "bonus_leave_grants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "company_settings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extended_absences" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leave_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leave_types" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_assignments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
DROP POLICY "Users can view own bonus leave grants" ON "bonus_leave_grants" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can view all bonus leave grants" ON "bonus_leave_grants" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can insert bonus leave grants" ON "bonus_leave_grants" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can update bonus leave grants" ON "bonus_leave_grants" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can delete bonus leave grants" ON "bonus_leave_grants" CASCADE;--> statement-breakpoint
DROP POLICY "Allow read to all authenticated users" ON "company_settings" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can modify company_settings" ON "company_settings" CASCADE;--> statement-breakpoint
DROP POLICY "Service role can modify" ON "company_settings" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own extended absences" ON "extended_absences" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can manage all extended absences" ON "extended_absences" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own leave requests" ON "leave_requests" CASCADE;--> statement-breakpoint
DROP POLICY "Users can insert their own leave requests" ON "leave_requests" CASCADE;--> statement-breakpoint
DROP POLICY "Service role can do everything" ON "leave_requests" CASCADE;--> statement-breakpoint
DROP POLICY "Admins and managers can view and update all leave requests" ON "leave_requests" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own pending leave requests" ON "leave_requests" CASCADE;--> statement-breakpoint
DROP POLICY "Allow read to all authenticated users" ON "leave_types" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can modify leave_types" ON "leave_types" CASCADE;--> statement-breakpoint
DROP POLICY "Service role can modify" ON "leave_types" CASCADE;--> statement-breakpoint
DROP POLICY "admin_crud_project_assignments" ON "project_assignments" CASCADE;--> statement-breakpoint
DROP POLICY "user_crud_own_assignments" ON "project_assignments" CASCADE;--> statement-breakpoint
DROP POLICY "Anyone can view projects" ON "projects" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can manage projects" ON "projects" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can perform all actions on users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Authenticated users can view other users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own profile" ON "users" CASCADE;